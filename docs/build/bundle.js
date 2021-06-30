
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    // Track which nodes are claimed during hydration. Unclaimed nodes can then be removed from the DOM
    // at the end of hydration without touching the remaining nodes.
    let is_hydrating = false;
    function start_hydrating() {
        is_hydrating = true;
    }
    function end_hydrating() {
        is_hydrating = false;
    }
    function upper_bound(low, high, key, value) {
        // Return first index of value larger than input value in the range [low, high)
        while (low < high) {
            const mid = low + ((high - low) >> 1);
            if (key(mid) <= value) {
                low = mid + 1;
            }
            else {
                high = mid;
            }
        }
        return low;
    }
    function init_hydrate(target) {
        if (target.hydrate_init)
            return;
        target.hydrate_init = true;
        // We know that all children have claim_order values since the unclaimed have been detached
        const children = target.childNodes;
        /*
        * Reorder claimed children optimally.
        * We can reorder claimed children optimally by finding the longest subsequence of
        * nodes that are already claimed in order and only moving the rest. The longest
        * subsequence subsequence of nodes that are claimed in order can be found by
        * computing the longest increasing subsequence of .claim_order values.
        *
        * This algorithm is optimal in generating the least amount of reorder operations
        * possible.
        *
        * Proof:
        * We know that, given a set of reordering operations, the nodes that do not move
        * always form an increasing subsequence, since they do not move among each other
        * meaning that they must be already ordered among each other. Thus, the maximal
        * set of nodes that do not move form a longest increasing subsequence.
        */
        // Compute longest increasing subsequence
        // m: subsequence length j => index k of smallest value that ends an increasing subsequence of length j
        const m = new Int32Array(children.length + 1);
        // Predecessor indices + 1
        const p = new Int32Array(children.length);
        m[0] = -1;
        let longest = 0;
        for (let i = 0; i < children.length; i++) {
            const current = children[i].claim_order;
            // Find the largest subsequence length such that it ends in a value less than our current value
            // upper_bound returns first greater value, so we subtract one
            const seqLen = upper_bound(1, longest + 1, idx => children[m[idx]].claim_order, current) - 1;
            p[i] = m[seqLen] + 1;
            const newLen = seqLen + 1;
            // We can guarantee that current is the smallest value. Otherwise, we would have generated a longer sequence.
            m[newLen] = i;
            longest = Math.max(newLen, longest);
        }
        // The longest increasing subsequence of nodes (initially reversed)
        const lis = [];
        // The rest of the nodes, nodes that will be moved
        const toMove = [];
        let last = children.length - 1;
        for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
            lis.push(children[cur - 1]);
            for (; last >= cur; last--) {
                toMove.push(children[last]);
            }
            last--;
        }
        for (; last >= 0; last--) {
            toMove.push(children[last]);
        }
        lis.reverse();
        // We sort the nodes being moved to guarantee that their insertion order matches the claim order
        toMove.sort((a, b) => a.claim_order - b.claim_order);
        // Finally, we move the nodes
        for (let i = 0, j = 0; i < toMove.length; i++) {
            while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
                j++;
            }
            const anchor = j < lis.length ? lis[j] : null;
            target.insertBefore(toMove[i], anchor);
        }
    }
    function append(target, node) {
        if (is_hydrating) {
            init_hydrate(target);
            if ((target.actual_end_child === undefined) || ((target.actual_end_child !== null) && (target.actual_end_child.parentElement !== target))) {
                target.actual_end_child = target.firstChild;
            }
            if (node !== target.actual_end_child) {
                target.insertBefore(node, target.actual_end_child);
            }
            else {
                target.actual_end_child = node.nextSibling;
            }
        }
        else if (node.parentNode !== target) {
            target.appendChild(node);
        }
    }
    function insert(target, node, anchor) {
        if (is_hydrating && !anchor) {
            append(target, node);
        }
        else if (node.parentNode !== target || (anchor && node.nextSibling !== anchor)) {
            target.insertBefore(node, anchor || null);
        }
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                start_hydrating();
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            end_hydrating();
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.3' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\DiveTableHead.svelte generated by Svelte v3.38.3 */

    const file$6 = "src\\components\\DiveTableHead.svelte";

    function create_fragment$6(ctx) {
    	let thead;
    	let tr0;
    	let th0;
    	let t0;
    	let th1;
    	let t2;
    	let th2;
    	let t3;
    	let br0;
    	let t4;
    	let br1;
    	let t5;
    	let t6;
    	let th3;
    	let t8;
    	let th4;
    	let t10;
    	let th5;
    	let t12;
    	let th6;
    	let t14;
    	let th7;
    	let t15;
    	let tr1;
    	let td0;
    	let t17;
    	let td1;
    	let t19;
    	let td2;
    	let t21;
    	let td3;
    	let t23;
    	let td4;
    	let t25;
    	let td5;
    	let t27;
    	let td6;

    	const block = {
    		c: function create() {
    			thead = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			t0 = space();
    			th1 = element("th");
    			th1.textContent = "Dive Number";
    			t2 = space();
    			th2 = element("th");
    			t3 = text("POS");
    			br0 = element("br");
    			t4 = text("A B ");
    			br1 = element("br");
    			t5 = text("C D");
    			t6 = space();
    			th3 = element("th");
    			th3.textContent = "Dive Description";
    			t8 = space();
    			th4 = element("th");
    			th4.textContent = "D.D.";
    			t10 = space();
    			th5 = element("th");
    			th5.textContent = "Judges' Awards";
    			t12 = space();
    			th6 = element("th");
    			th6.textContent = "Net Total";
    			t14 = space();
    			th7 = element("th");
    			t15 = space();
    			tr1 = element("tr");
    			td0 = element("td");
    			td0.textContent = "1";
    			t17 = space();
    			td1 = element("td");
    			td1.textContent = "2";
    			t19 = space();
    			td2 = element("td");
    			td2.textContent = "3";
    			t21 = space();
    			td3 = element("td");
    			td3.textContent = "4";
    			t23 = space();
    			td4 = element("td");
    			td4.textContent = "5";
    			t25 = space();
    			td5 = element("td");
    			td5.textContent = "6";
    			t27 = space();
    			td6 = element("td");
    			td6.textContent = "7";
    			attr_dev(th0, "id", "num");
    			attr_dev(th0, "rowspan", "2");
    			attr_dev(th0, "class", "svelte-k1x8h1");
    			add_location(th0, file$6, 5, 4, 44);
    			attr_dev(th1, "rowspan", "2");
    			add_location(th1, file$6, 6, 4, 77);
    			add_location(br0, file$6, 7, 32, 143);
    			add_location(br1, file$6, 7, 42, 153);
    			attr_dev(th2, "id", "pos");
    			attr_dev(th2, "rowspan", "2");
    			attr_dev(th2, "class", "svelte-k1x8h1");
    			add_location(th2, file$6, 7, 4, 115);
    			attr_dev(th3, "id", "desc");
    			attr_dev(th3, "rowspan", "2");
    			attr_dev(th3, "class", "svelte-k1x8h1");
    			add_location(th3, file$6, 8, 4, 173);
    			attr_dev(th4, "rowspan", "2");
    			add_location(th4, file$6, 9, 4, 226);
    			attr_dev(th5, "colspan", "7");
    			add_location(th5, file$6, 10, 4, 257);
    			attr_dev(th6, "rowspan", "2");
    			add_location(th6, file$6, 11, 4, 298);
    			attr_dev(th7, "id", "score");
    			attr_dev(th7, "colspan", "5");
    			attr_dev(th7, "rowspan", "2");
    			attr_dev(th7, "class", "svelte-k1x8h1");
    			add_location(th7, file$6, 12, 4, 334);
    			add_location(tr0, file$6, 4, 2, 34);
    			attr_dev(td0, "class", "center-txt");
    			add_location(td0, file$6, 15, 4, 398);
    			attr_dev(td1, "class", "center-txt");
    			add_location(td1, file$6, 16, 4, 433);
    			attr_dev(td2, "class", "center-txt");
    			add_location(td2, file$6, 17, 4, 468);
    			attr_dev(td3, "class", "center-txt");
    			add_location(td3, file$6, 18, 4, 503);
    			attr_dev(td4, "class", "center-txt");
    			add_location(td4, file$6, 19, 4, 538);
    			attr_dev(td5, "class", "center-txt");
    			add_location(td5, file$6, 20, 4, 573);
    			attr_dev(td6, "class", "center-txt");
    			add_location(td6, file$6, 21, 4, 608);
    			add_location(tr1, file$6, 14, 2, 388);
    			add_location(thead, file$6, 3, 0, 23);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, thead, anchor);
    			append_dev(thead, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t0);
    			append_dev(tr0, th1);
    			append_dev(tr0, t2);
    			append_dev(tr0, th2);
    			append_dev(th2, t3);
    			append_dev(th2, br0);
    			append_dev(th2, t4);
    			append_dev(th2, br1);
    			append_dev(th2, t5);
    			append_dev(tr0, t6);
    			append_dev(tr0, th3);
    			append_dev(tr0, t8);
    			append_dev(tr0, th4);
    			append_dev(tr0, t10);
    			append_dev(tr0, th5);
    			append_dev(tr0, t12);
    			append_dev(tr0, th6);
    			append_dev(tr0, t14);
    			append_dev(tr0, th7);
    			append_dev(thead, t15);
    			append_dev(thead, tr1);
    			append_dev(tr1, td0);
    			append_dev(tr1, t17);
    			append_dev(tr1, td1);
    			append_dev(tr1, t19);
    			append_dev(tr1, td2);
    			append_dev(tr1, t21);
    			append_dev(tr1, td3);
    			append_dev(tr1, t23);
    			append_dev(tr1, td4);
    			append_dev(tr1, t25);
    			append_dev(tr1, td5);
    			append_dev(tr1, t27);
    			append_dev(tr1, td6);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(thead);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("DiveTableHead", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DiveTableHead> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class DiveTableHead extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DiveTableHead",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const ddTable = {
      "100A": "1.0",
      "101A": "1.4",
      "101B": "1.3",
      "101C": "1.2",
      "102A": "1.6",
      "102B": "1.5",
      "102C": "1.4",
      "103B": "1.7",
      "103C": "1.6",
      "104B": "2.3",
      "104C": "2.2",
      "105B": "2.6",
      "105C": "2.4",
      "106C": "2.9",
      "107C": "3.0",
      "112B": "1.7",
      "112C": "1.6",
      "113B": "1.9",
      "113C": "1.8",
      "200A": "1.0",
      "201A": "1.7",
      "201B": "1.6",
      "201C": "1.5",
      "202A": "1.7",
      "202B": "1.6",
      "202C": "1.5",
      "203A": "2.5",
      "203B": "2.3",
      "203C": "2.0",
      "204B": "2.5",
      "204C": "2.2",
      "205B": "3.2",
      "205C": "3.0",
      "212B": "1.7",
      "212C": "1.6",
      "301A": "1.8",
      "301B": "1.7",
      "301C": "1.6",
      "302A": "1.8",
      "302B": "1.7",
      "302C": "1.6",
      "303A": "2.7",
      "303B": "2.4",
      "303C": "2.1",
      "304B": "2.6",
      "304C": "2.3",
      "305B": "3.2",
      "305C": "3.0",
      "312B": "1.8",
      "312C": "1.7",
      "401A": "1.8",
      "401B": "1.5",
      "401C": "1.4",
      "402B": "1.7",
      "402C": "1.6",
      "403B": "2.4",
      "403C": "2.2",
      "404C": "2.8",
      "405B": "3.4",
      "405C": "3.1",
      "412B": "2.1",
      "412C": "2.0",
      "413C": "2.7",
      "5111A": "1.8",
      "5111B": "1.7",
      "5112A": "2.0",
      "5112B": "1.9",
      "5121A": "1.9",
      "5121B": "1.8",
      "5121D": "1.7",
      "5122D": "1.9",
      "5124D": "2.3",
      "5126D": "2.7",
      "5131B": "2.1",
      "5131C": "2.0",
      "5132D": "2.2",
      "5134D": "2.6",
      "5136D": "3.0",
      "5152B": "3.2",
      "5152C": "3.0",
      "5211A": "1.8",
      "5212A": "2.0",
      "5221D": "1.7",
      "5222D": "1.9",
      "5223D": "2.3",
      "5225D": "2.7",
      "5231D": "2.1",
      "5233D": "2.5",
      "5235D": "2.9",
      "5311A": "1.9",
      "5312A": "2.1",
      "5321D": "1.8",
      "5322D": "2.0",
      "5323D": "2.4",
      "5325D": "2.8",
      "5331D": "2.2",
      "5333D": "2.6",
      "5335D": "3.0",
      "5411A": "2.0",
      "5411B": "1.7",
      "5412A": "2.2",
      "5412B": "1.9",
      "5421B": "1.8",
      "5421C": "1.7",
      "5422D": "2.1",
      "5432D": "2.7",
      "5434D": "3.1",
    };

    /* src\components\DiveTableRow.svelte generated by Svelte v3.38.3 */
    const file$5 = "src\\components\\DiveTableRow.svelte";

    // (74:12) {:else}
    function create_else_block_1(ctx) {
    	let t_value = (/*numbers*/ ctx[5][2] >= 2
    	? `${Math.floor(parseInt(/*numbers*/ ctx[5][2]) / 2)} 
                ${parseInt(/*numbers*/ ctx[5][2]) % 2 === 1 ? "1/2" : ""} S.S.`
    	: "") + "";

    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*numbers*/ 32 && t_value !== (t_value = (/*numbers*/ ctx[5][2] >= 2
    			? `${Math.floor(parseInt(/*numbers*/ ctx[5][2]) / 2)} 
                ${parseInt(/*numbers*/ ctx[5][2]) % 2 === 1 ? "1/2" : ""} S.S.`
    			: "") + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(74:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (69:12) {#if twister}
    function create_if_block_1$1(ctx) {
    	let t_value = (/*numbers*/ ctx[5][1] >= 2
    	? `${Math.floor(parseInt(/*numbers*/ ctx[5][1]) / 2)} 
                ${parseInt(/*numbers*/ ctx[5][1]) % 2 === 1 ? "1/2" : ""} S.S.`
    	: "") + "";

    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*numbers*/ 32 && t_value !== (t_value = (/*numbers*/ ctx[5][1] >= 2
    			? `${Math.floor(parseInt(/*numbers*/ ctx[5][1]) / 2)} 
                ${parseInt(/*numbers*/ ctx[5][1]) % 2 === 1 ? "1/2" : ""} S.S.`
    			: "") + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(69:12) {#if twister}",
    		ctx
    	});

    	return block;
    }

    // (128:4) {:else}
    function create_else_block$1(ctx) {
    	let td0;
    	let t0;
    	let td1;
    	let t1;
    	let td2;
    	let t2;
    	let td3;
    	let t3;
    	let td4;

    	const block = {
    		c: function create() {
    			td0 = element("td");
    			t0 = space();
    			td1 = element("td");
    			t1 = space();
    			td2 = element("td");
    			t2 = space();
    			td3 = element("td");
    			t3 = space();
    			td4 = element("td");
    			attr_dev(td0, "id", "score1");
    			attr_dev(td0, "class", "tg-0lax score svelte-130wkro");
    			attr_dev(td0, "rowspan", "3");
    			add_location(td0, file$5, 128, 6, 4316);
    			attr_dev(td1, "id", "score2");
    			attr_dev(td1, "class", "tg-0lax score svelte-130wkro");
    			attr_dev(td1, "rowspan", "3");
    			add_location(td1, file$5, 129, 6, 4376);
    			attr_dev(td2, "id", "score3");
    			attr_dev(td2, "class", "tg-0lax score svelte-130wkro");
    			attr_dev(td2, "rowspan", "3");
    			add_location(td2, file$5, 130, 6, 4436);
    			attr_dev(td3, "id", "score4");
    			attr_dev(td3, "class", "tg-0lax score svelte-130wkro");
    			attr_dev(td3, "rowspan", "3");
    			add_location(td3, file$5, 131, 6, 4496);
    			attr_dev(td4, "id", "score5");
    			attr_dev(td4, "class", "tg-0lax score svelte-130wkro");
    			attr_dev(td4, "rowspan", "3");
    			add_location(td4, file$5, 132, 6, 4556);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, td1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, td2, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, td3, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, td4, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(td1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(td2);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(td3);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(td4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(128:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (113:4) {#if firstRow}
    function create_if_block$2(ctx) {
    	let td6;
    	let table;
    	let tr0;
    	let td0;
    	let t1;
    	let tr1;
    	let td1;
    	let t3;
    	let td2;
    	let t5;
    	let td3;
    	let t7;
    	let td4;
    	let t9;
    	let td5;

    	const block = {
    		c: function create() {
    			td6 = element("td");
    			table = element("table");
    			tr0 = element("tr");
    			td0 = element("td");
    			td0.textContent = "Scores";
    			t1 = space();
    			tr1 = element("tr");
    			td1 = element("td");
    			td1.textContent = "1";
    			t3 = space();
    			td2 = element("td");
    			td2.textContent = "1";
    			t5 = space();
    			td3 = element("td");
    			td3.textContent = "1";
    			t7 = space();
    			td4 = element("td");
    			td4.textContent = "1";
    			t9 = space();
    			td5 = element("td");
    			td5.textContent = "1";
    			attr_dev(td0, "id", "score");
    			attr_dev(td0, "colspan", "5");
    			attr_dev(td0, "class", "svelte-130wkro");
    			add_location(td0, file$5, 116, 12, 3881);
    			attr_dev(tr0, "class", "svelte-130wkro");
    			add_location(tr0, file$5, 115, 10, 3863);
    			attr_dev(td1, "id", "score1");
    			attr_dev(td1, "class", "tg-0lax invis svelte-130wkro");
    			add_location(td1, file$5, 119, 12, 3966);
    			attr_dev(td2, "id", "score2");
    			attr_dev(td2, "class", "tg-0lax invis svelte-130wkro");
    			add_location(td2, file$5, 120, 12, 4025);
    			attr_dev(td3, "id", "score3");
    			attr_dev(td3, "class", "tg-0lax invis svelte-130wkro");
    			add_location(td3, file$5, 121, 12, 4084);
    			attr_dev(td4, "id", "score4");
    			attr_dev(td4, "class", "tg-0lax invis svelte-130wkro");
    			add_location(td4, file$5, 122, 12, 4143);
    			attr_dev(td5, "id", "score5");
    			attr_dev(td5, "class", "tg-0lax invis svelte-130wkro");
    			add_location(td5, file$5, 123, 12, 4202);
    			attr_dev(tr1, "class", "svelte-130wkro");
    			add_location(tr1, file$5, 118, 10, 3948);
    			attr_dev(table, "class", "scoresTable table svelte-130wkro");
    			add_location(table, file$5, 114, 8, 3818);
    			attr_dev(td6, "colspan", "5");
    			attr_dev(td6, "class", "table-housing svelte-130wkro");
    			add_location(td6, file$5, 113, 6, 3770);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td6, anchor);
    			append_dev(td6, table);
    			append_dev(table, tr0);
    			append_dev(tr0, td0);
    			append_dev(table, t1);
    			append_dev(table, tr1);
    			append_dev(tr1, td1);
    			append_dev(tr1, t3);
    			append_dev(tr1, td2);
    			append_dev(tr1, t5);
    			append_dev(tr1, td3);
    			append_dev(tr1, t7);
    			append_dev(tr1, td4);
    			append_dev(tr1, t9);
    			append_dev(tr1, td5);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td6);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(113:4) {#if firstRow}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let tbody;
    	let tr3;
    	let td0;
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = (/*twister*/ ctx[4] ? "5" : "") + /*numbers*/ ctx[5] + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4;
    	let t5;
    	let td17;
    	let table;
    	let tr0;
    	let td3;
    	let t7;
    	let td4;
    	let t9;
    	let td5;
    	let t11;
    	let td6;
    	let t13;
    	let td7;
    	let t15;
    	let td8;
    	let t17;
    	let tr1;
    	let td9;
    	let t19;
    	let td10;
    	let t20;
    	let td11;

    	let t21_value = (/*twister*/ ctx[4]
    	? `${Math.floor(parseInt(/*numbers*/ ctx[5][2]) / 2) !== 0
		? Math.floor(parseInt(/*numbers*/ ctx[5][2]) / 2)
		: ""} 
              ${parseInt(/*numbers*/ ctx[5][2]) % 2 === 1 ? "1/2" : ""} TWIST`
    	: "") + "";

    	let t21;
    	let t22;
    	let tr2;
    	let td12;
    	let t24;
    	let td13;
    	let t26;
    	let td14;
    	let t28;
    	let td15;
    	let t30;
    	let td16;
    	let t32;
    	let td18;
    	let t33;
    	let t34;
    	let td19;
    	let t35;
    	let td20;
    	let t36;
    	let td21;
    	let t37;
    	let td22;
    	let t38;
    	let td23;
    	let t39;
    	let td24;
    	let t40;
    	let td25;
    	let t41;
    	let td26;
    	let t42;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*twister*/ ctx[4]) return create_if_block_1$1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*firstRow*/ ctx[1]) return create_if_block$2;
    		return create_else_block$1;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			tbody = element("tbody");
    			tr3 = element("tr");
    			td0 = element("td");
    			t0 = text(/*row*/ ctx[0]);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(/*pos*/ ctx[3]);
    			t5 = space();
    			td17 = element("td");
    			table = element("table");
    			tr0 = element("tr");
    			td3 = element("td");
    			td3.textContent = "S";
    			t7 = space();
    			td4 = element("td");
    			td4.textContent = "R";
    			t9 = space();
    			td5 = element("td");
    			td5.textContent = "FWD";
    			t11 = space();
    			td6 = element("td");
    			td6.textContent = "BAC";
    			t13 = space();
    			td7 = element("td");
    			td7.textContent = "REV";
    			t15 = space();
    			td8 = element("td");
    			td8.textContent = "INW";
    			t17 = space();
    			tr1 = element("tr");
    			td9 = element("td");
    			td9.textContent = "DIVE";
    			t19 = space();
    			td10 = element("td");
    			if_block0.c();
    			t20 = space();
    			td11 = element("td");
    			t21 = text(t21_value);
    			t22 = space();
    			tr2 = element("tr");
    			td12 = element("td");
    			td12.textContent = "FLY";
    			t24 = space();
    			td13 = element("td");
    			td13.textContent = "TUC";
    			t26 = space();
    			td14 = element("td");
    			td14.textContent = "PIKE";
    			t28 = space();
    			td15 = element("td");
    			td15.textContent = "LAY";
    			t30 = space();
    			td16 = element("td");
    			td16.textContent = "FREE";
    			t32 = space();
    			td18 = element("td");
    			t33 = text(/*dd*/ ctx[6]);
    			t34 = space();
    			td19 = element("td");
    			t35 = space();
    			td20 = element("td");
    			t36 = space();
    			td21 = element("td");
    			t37 = space();
    			td22 = element("td");
    			t38 = space();
    			td23 = element("td");
    			t39 = space();
    			td24 = element("td");
    			t40 = space();
    			td25 = element("td");
    			t41 = space();
    			td26 = element("td");
    			t42 = space();
    			if_block1.c();
    			attr_dev(td0, "title", "Reset Dive");
    			attr_dev(td0, "id", "number");
    			attr_dev(td0, "rowspan", "3");
    			attr_dev(td0, "class", "svelte-130wkro");
    			add_location(td0, file$5, 34, 4, 985);
    			attr_dev(td1, "contenteditable", "");
    			attr_dev(td1, "id", "diveNumbers");
    			attr_dev(td1, "class", "tg-0lax answer svelte-130wkro");
    			attr_dev(td1, "rowspan", "3");
    			if (/*numbersDisp*/ ctx[2] === void 0) add_render_callback(() => /*td1_input_handler*/ ctx[9].call(td1));
    			add_location(td1, file$5, 35, 4, 1065);
    			attr_dev(td2, "contenteditable", "");
    			attr_dev(td2, "id", "pos");
    			attr_dev(td2, "class", "tg-0lax answer svelte-130wkro");
    			attr_dev(td2, "rowspan", "3");
    			if (/*pos*/ ctx[3] === void 0) add_render_callback(() => /*td2_input_handler*/ ctx[10].call(td2));
    			add_location(td2, file$5, 44, 4, 1264);
    			attr_dev(td3, "class", "svelte-130wkro");
    			add_location(td3, file$5, 54, 10, 1521);
    			attr_dev(td4, "class", "svelte-130wkro");
    			add_location(td4, file$5, 55, 10, 1543);
    			attr_dev(td5, "class", "svelte-130wkro");
    			toggle_class(td5, "circle", /*numbers*/ ctx[5][0] === "1");
    			add_location(td5, file$5, 56, 10, 1565);
    			attr_dev(td6, "class", "svelte-130wkro");
    			toggle_class(td6, "circle", /*numbers*/ ctx[5][0] === "2");
    			add_location(td6, file$5, 57, 10, 1623);
    			attr_dev(td7, "class", "svelte-130wkro");
    			toggle_class(td7, "circle", /*numbers*/ ctx[5][0] === "3");
    			add_location(td7, file$5, 58, 10, 1681);
    			attr_dev(td8, "class", "svelte-130wkro");
    			toggle_class(td8, "circle", /*numbers*/ ctx[5][0] === "4");
    			add_location(td8, file$5, 59, 10, 1739);
    			attr_dev(tr0, "class", "svelte-130wkro");
    			add_location(tr0, file$5, 53, 8, 1505);
    			attr_dev(td9, "colspan", "2");
    			attr_dev(td9, "class", "svelte-130wkro");
    			toggle_class(td9, "circle", !/*twister*/ ctx[4] && /*numbers*/ ctx[5][2] === "1" || /*numbers*/ ctx[5][1] === "1");
    			add_location(td9, file$5, 62, 10, 1826);
    			attr_dev(td10, "class", "answer svelte-130wkro");
    			attr_dev(td10, "colspan", "2");
    			add_location(td10, file$5, 67, 10, 1986);
    			attr_dev(td11, "class", "answer svelte-130wkro");
    			attr_dev(td11, "colspan", "2");
    			add_location(td11, file$5, 80, 10, 2485);
    			attr_dev(tr1, "class", "svelte-130wkro");
    			add_location(tr1, file$5, 61, 8, 1810);
    			attr_dev(td12, "class", "col20 svelte-130wkro");
    			attr_dev(td12, "colspan", "2");
    			add_location(td12, file$5, 92, 10, 2875);
    			attr_dev(td13, "class", "col20 svelte-130wkro");
    			toggle_class(td13, "circle", /*pos*/ ctx[3] === "C");
    			add_location(td13, file$5, 93, 10, 2925);
    			attr_dev(td14, "class", "col20 svelte-130wkro");
    			toggle_class(td14, "circle", /*pos*/ ctx[3] === "B");
    			add_location(td14, file$5, 94, 10, 2990);
    			attr_dev(td15, "class", "col20 svelte-130wkro");
    			toggle_class(td15, "circle", /*pos*/ ctx[3] === "A");
    			add_location(td15, file$5, 95, 10, 3056);
    			attr_dev(td16, "class", "col20 svelte-130wkro");
    			toggle_class(td16, "circle", /*pos*/ ctx[3] === "D");
    			add_location(td16, file$5, 96, 10, 3121);
    			attr_dev(tr2, "class", "svelte-130wkro");
    			add_location(tr2, file$5, 91, 8, 2859);
    			attr_dev(table, "class", "innerTable table svelte-130wkro");
    			add_location(table, file$5, 52, 6, 1463);
    			attr_dev(td17, "id", "description");
    			attr_dev(td17, "rowspan", "3");
    			attr_dev(td17, "class", "tg-0lax svelte-130wkro");
    			add_location(td17, file$5, 51, 4, 1406);
    			attr_dev(td18, "contenteditable", "");
    			attr_dev(td18, "id", "dd");
    			attr_dev(td18, "class", "tg-0lax svelte-130wkro");
    			attr_dev(td18, "rowspan", "3");
    			if (/*dd*/ ctx[6] === void 0) add_render_callback(() => /*td18_input_handler*/ ctx[11].call(td18));
    			add_location(td18, file$5, 100, 4, 3223);
    			attr_dev(td19, "id", "award1");
    			attr_dev(td19, "class", "tg-0lax svelte-130wkro");
    			attr_dev(td19, "rowspan", "3");
    			add_location(td19, file$5, 103, 4, 3328);
    			attr_dev(td20, "id", "award2");
    			attr_dev(td20, "class", "tg-0lax svelte-130wkro");
    			attr_dev(td20, "rowspan", "3");
    			add_location(td20, file$5, 104, 4, 3380);
    			attr_dev(td21, "id", "award3");
    			attr_dev(td21, "class", "tg-0lax svelte-130wkro");
    			attr_dev(td21, "rowspan", "3");
    			add_location(td21, file$5, 105, 4, 3432);
    			attr_dev(td22, "id", "award4");
    			attr_dev(td22, "class", "tg-0lax svelte-130wkro");
    			attr_dev(td22, "rowspan", "3");
    			add_location(td22, file$5, 106, 4, 3484);
    			attr_dev(td23, "id", "award5");
    			attr_dev(td23, "class", "tg-0lax svelte-130wkro");
    			attr_dev(td23, "rowspan", "3");
    			add_location(td23, file$5, 107, 4, 3536);
    			attr_dev(td24, "id", "award6");
    			attr_dev(td24, "class", "tg-0lax svelte-130wkro");
    			attr_dev(td24, "rowspan", "3");
    			add_location(td24, file$5, 108, 4, 3588);
    			attr_dev(td25, "id", "award7");
    			attr_dev(td25, "class", "tg-0lax svelte-130wkro");
    			attr_dev(td25, "rowspan", "3");
    			add_location(td25, file$5, 109, 4, 3640);
    			attr_dev(td26, "id", "netTotal");
    			attr_dev(td26, "class", "tg-0lax svelte-130wkro");
    			attr_dev(td26, "rowspan", "3");
    			add_location(td26, file$5, 110, 4, 3692);
    			attr_dev(tr3, "class", "svelte-130wkro");
    			add_location(tr3, file$5, 33, 2, 975);
    			attr_dev(tbody, "class", "table-row");
    			add_location(tbody, file$5, 32, 0, 946);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tbody, anchor);
    			append_dev(tbody, tr3);
    			append_dev(tr3, td0);
    			append_dev(td0, t0);
    			append_dev(tr3, t1);
    			append_dev(tr3, td1);
    			append_dev(td1, t2);

    			if (/*numbersDisp*/ ctx[2] !== void 0) {
    				td1.innerHTML = /*numbersDisp*/ ctx[2];
    			}

    			append_dev(tr3, t3);
    			append_dev(tr3, td2);
    			append_dev(td2, t4);

    			if (/*pos*/ ctx[3] !== void 0) {
    				td2.innerHTML = /*pos*/ ctx[3];
    			}

    			append_dev(tr3, t5);
    			append_dev(tr3, td17);
    			append_dev(td17, table);
    			append_dev(table, tr0);
    			append_dev(tr0, td3);
    			append_dev(tr0, t7);
    			append_dev(tr0, td4);
    			append_dev(tr0, t9);
    			append_dev(tr0, td5);
    			append_dev(tr0, t11);
    			append_dev(tr0, td6);
    			append_dev(tr0, t13);
    			append_dev(tr0, td7);
    			append_dev(tr0, t15);
    			append_dev(tr0, td8);
    			append_dev(table, t17);
    			append_dev(table, tr1);
    			append_dev(tr1, td9);
    			append_dev(tr1, t19);
    			append_dev(tr1, td10);
    			if_block0.m(td10, null);
    			append_dev(tr1, t20);
    			append_dev(tr1, td11);
    			append_dev(td11, t21);
    			append_dev(table, t22);
    			append_dev(table, tr2);
    			append_dev(tr2, td12);
    			append_dev(tr2, t24);
    			append_dev(tr2, td13);
    			append_dev(tr2, t26);
    			append_dev(tr2, td14);
    			append_dev(tr2, t28);
    			append_dev(tr2, td15);
    			append_dev(tr2, t30);
    			append_dev(tr2, td16);
    			append_dev(tr3, t32);
    			append_dev(tr3, td18);
    			append_dev(td18, t33);

    			if (/*dd*/ ctx[6] !== void 0) {
    				td18.innerHTML = /*dd*/ ctx[6];
    			}

    			append_dev(tr3, t34);
    			append_dev(tr3, td19);
    			append_dev(tr3, t35);
    			append_dev(tr3, td20);
    			append_dev(tr3, t36);
    			append_dev(tr3, td21);
    			append_dev(tr3, t37);
    			append_dev(tr3, td22);
    			append_dev(tr3, t38);
    			append_dev(tr3, td23);
    			append_dev(tr3, t39);
    			append_dev(tr3, td24);
    			append_dev(tr3, t40);
    			append_dev(tr3, td25);
    			append_dev(tr3, t41);
    			append_dev(tr3, td26);
    			append_dev(tr3, t42);
    			if_block1.m(tr3, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(td0, "click", /*reset*/ ctx[7], false, false, false),
    					listen_dev(td1, "input", /*td1_input_handler*/ ctx[9]),
    					listen_dev(td2, "input", /*td2_input_handler*/ ctx[10]),
    					listen_dev(td18, "input", /*td18_input_handler*/ ctx[11])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*row*/ 1) set_data_dev(t0, /*row*/ ctx[0]);
    			if (dirty & /*twister, numbers*/ 48 && t2_value !== (t2_value = (/*twister*/ ctx[4] ? "5" : "") + /*numbers*/ ctx[5] + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*numbersDisp*/ 4 && /*numbersDisp*/ ctx[2] !== td1.innerHTML) {
    				td1.innerHTML = /*numbersDisp*/ ctx[2];
    			}

    			if (dirty & /*pos*/ 8) set_data_dev(t4, /*pos*/ ctx[3]);

    			if (dirty & /*pos*/ 8 && /*pos*/ ctx[3] !== td2.innerHTML) {
    				td2.innerHTML = /*pos*/ ctx[3];
    			}

    			if (dirty & /*numbers*/ 32) {
    				toggle_class(td5, "circle", /*numbers*/ ctx[5][0] === "1");
    			}

    			if (dirty & /*numbers*/ 32) {
    				toggle_class(td6, "circle", /*numbers*/ ctx[5][0] === "2");
    			}

    			if (dirty & /*numbers*/ 32) {
    				toggle_class(td7, "circle", /*numbers*/ ctx[5][0] === "3");
    			}

    			if (dirty & /*numbers*/ 32) {
    				toggle_class(td8, "circle", /*numbers*/ ctx[5][0] === "4");
    			}

    			if (dirty & /*twister, numbers*/ 48) {
    				toggle_class(td9, "circle", !/*twister*/ ctx[4] && /*numbers*/ ctx[5][2] === "1" || /*numbers*/ ctx[5][1] === "1");
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(td10, null);
    				}
    			}

    			if (dirty & /*twister, numbers*/ 48 && t21_value !== (t21_value = (/*twister*/ ctx[4]
    			? `${Math.floor(parseInt(/*numbers*/ ctx[5][2]) / 2) !== 0
				? Math.floor(parseInt(/*numbers*/ ctx[5][2]) / 2)
				: ""} 
              ${parseInt(/*numbers*/ ctx[5][2]) % 2 === 1 ? "1/2" : ""} TWIST`
    			: "") + "")) set_data_dev(t21, t21_value);

    			if (dirty & /*pos*/ 8) {
    				toggle_class(td13, "circle", /*pos*/ ctx[3] === "C");
    			}

    			if (dirty & /*pos*/ 8) {
    				toggle_class(td14, "circle", /*pos*/ ctx[3] === "B");
    			}

    			if (dirty & /*pos*/ 8) {
    				toggle_class(td15, "circle", /*pos*/ ctx[3] === "A");
    			}

    			if (dirty & /*pos*/ 8) {
    				toggle_class(td16, "circle", /*pos*/ ctx[3] === "D");
    			}

    			if (dirty & /*dd*/ 64) set_data_dev(t33, /*dd*/ ctx[6]);

    			if (dirty & /*dd*/ 64 && /*dd*/ ctx[6] !== td18.innerHTML) {
    				td18.innerHTML = /*dd*/ ctx[6];
    			}

    			if (current_block_type_1 !== (current_block_type_1 = select_block_type_1(ctx))) {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(tr3, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tbody);
    			if_block0.d();
    			if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let dd;
    	let twister;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("DiveTableRow", slots, []);
    	let { row = 1 } = $$props;
    	let { numberPos } = $$props;
    	let { firstRow = false } = $$props;
    	let numbers;
    	let numbersDisp;
    	let pos;

    	if (numberPos !== undefined) {
    		numbersDisp = numberPos.substring(0, numberPos.length - 1);
    		pos = numberPos.charAt(numberPos.length - 1).toUpperCase();
    	}

    	const reset = () => {
    		$$invalidate(2, numbersDisp = numberPos.substring(0, numberPos.length - 1));
    		$$invalidate(3, pos = numberPos.charAt(numberPos.length - 1).toUpperCase());

    		$$invalidate(6, dd = numbersDisp + pos === ""
    		? ""
    		: ddTable[numbersDisp + pos]);
    	};

    	const writable_props = ["row", "numberPos", "firstRow"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DiveTableRow> was created with unknown prop '${key}'`);
    	});

    	function td1_input_handler() {
    		numbersDisp = this.innerHTML;
    		($$invalidate(2, numbersDisp), $$invalidate(8, numberPos));
    	}

    	function td2_input_handler() {
    		pos = this.innerHTML;
    		($$invalidate(3, pos), $$invalidate(8, numberPos));
    	}

    	function td18_input_handler() {
    		dd = this.innerHTML;
    		((($$invalidate(6, dd), $$invalidate(2, numbersDisp)), $$invalidate(3, pos)), $$invalidate(8, numberPos));
    	}

    	$$self.$$set = $$props => {
    		if ("row" in $$props) $$invalidate(0, row = $$props.row);
    		if ("numberPos" in $$props) $$invalidate(8, numberPos = $$props.numberPos);
    		if ("firstRow" in $$props) $$invalidate(1, firstRow = $$props.firstRow);
    	};

    	$$self.$capture_state = () => ({
    		ddTable,
    		row,
    		numberPos,
    		firstRow,
    		numbers,
    		numbersDisp,
    		pos,
    		reset,
    		dd,
    		twister
    	});

    	$$self.$inject_state = $$props => {
    		if ("row" in $$props) $$invalidate(0, row = $$props.row);
    		if ("numberPos" in $$props) $$invalidate(8, numberPos = $$props.numberPos);
    		if ("firstRow" in $$props) $$invalidate(1, firstRow = $$props.firstRow);
    		if ("numbers" in $$props) $$invalidate(5, numbers = $$props.numbers);
    		if ("numbersDisp" in $$props) $$invalidate(2, numbersDisp = $$props.numbersDisp);
    		if ("pos" in $$props) $$invalidate(3, pos = $$props.pos);
    		if ("dd" in $$props) $$invalidate(6, dd = $$props.dd);
    		if ("twister" in $$props) $$invalidate(4, twister = $$props.twister);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*numberPos*/ 256) {
    			$$invalidate(2, numbersDisp = numberPos.substring(0, numberPos.length - 1));
    		}

    		if ($$self.$$.dirty & /*numberPos*/ 256) {
    			$$invalidate(3, pos = numberPos.charAt(numberPos.length - 1).toUpperCase());
    		}

    		if ($$self.$$.dirty & /*pos*/ 8) {
    			$$invalidate(3, pos = pos.toUpperCase());
    		}

    		if ($$self.$$.dirty & /*numbersDisp, pos*/ 12) {
    			$$invalidate(6, dd = numbersDisp + pos === ""
    			? ""
    			: ddTable[numbersDisp + pos]);
    		}

    		if ($$self.$$.dirty & /*numbersDisp*/ 4) {
    			$$invalidate(4, twister = numbersDisp[0] === "5");
    		}

    		if ($$self.$$.dirty & /*twister, numbersDisp*/ 20) {
    			$$invalidate(5, numbers = twister ? numbersDisp.substring(1) : numbersDisp);
    		}
    	};

    	return [
    		row,
    		firstRow,
    		numbersDisp,
    		pos,
    		twister,
    		numbers,
    		dd,
    		reset,
    		numberPos,
    		td1_input_handler,
    		td2_input_handler,
    		td18_input_handler
    	];
    }

    class DiveTableRow extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { row: 0, numberPos: 8, firstRow: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DiveTableRow",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*numberPos*/ ctx[8] === undefined && !("numberPos" in props)) {
    			console.warn("<DiveTableRow> was created without expected prop 'numberPos'");
    		}
    	}

    	get row() {
    		throw new Error("<DiveTableRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set row(value) {
    		throw new Error("<DiveTableRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get numberPos() {
    		throw new Error("<DiveTableRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set numberPos(value) {
    		throw new Error("<DiveTableRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get firstRow() {
    		throw new Error("<DiveTableRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set firstRow(value) {
    		throw new Error("<DiveTableRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\SheetHeader.svelte generated by Svelte v3.38.3 */

    const file$4 = "src\\components\\SheetHeader.svelte";

    function create_fragment$4(ctx) {
    	let table;
    	let thead;
    	let tr0;
    	let th0;
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t2;
    	let t3;
    	let th1;
    	let div5;
    	let div3;
    	let t5;
    	let div4;
    	let t6;
    	let t7;
    	let th2;
    	let div7;
    	let div6;
    	let t9;
    	let th3;
    	let div9;
    	let div8;
    	let t11;
    	let tbody;
    	let tr1;
    	let td0;
    	let div12;
    	let div10;
    	let t13;
    	let div11;
    	let t14;
    	let t15;
    	let td1;
    	let div15;
    	let div13;
    	let t17;
    	let div14;
    	let t18;
    	let t19;
    	let td2;
    	let t21;
    	let tr2;
    	let td3;
    	let div18;
    	let div16;
    	let t23;
    	let div17;
    	let t24;
    	let t25;
    	let td4;
    	let div21;
    	let div19;
    	let t27;
    	let div20;
    	let t28;
    	let t29;
    	let tr3;
    	let td5;
    	let t31;
    	let td6;
    	let t33;
    	let td7;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			table = element("table");
    			thead = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Name";
    			t1 = space();
    			div1 = element("div");
    			t2 = text(/*name*/ ctx[0]);
    			t3 = space();
    			th1 = element("th");
    			div5 = element("div");
    			div3 = element("div");
    			div3.textContent = "Age Group";
    			t5 = space();
    			div4 = element("div");
    			t6 = text(/*ageGroup*/ ctx[1]);
    			t7 = space();
    			th2 = element("th");
    			div7 = element("div");
    			div6 = element("div");
    			div6.textContent = "Male";
    			t9 = space();
    			th3 = element("th");
    			div9 = element("div");
    			div8 = element("div");
    			div8.textContent = "Female";
    			t11 = space();
    			tbody = element("tbody");
    			tr1 = element("tr");
    			td0 = element("td");
    			div12 = element("div");
    			div10 = element("div");
    			div10.textContent = "Club Affiliation";
    			t13 = space();
    			div11 = element("div");
    			t14 = text(/*club*/ ctx[3]);
    			t15 = space();
    			td1 = element("td");
    			div15 = element("div");
    			div13 = element("div");
    			div13.textContent = "Meet";
    			t17 = space();
    			div14 = element("div");
    			t18 = text(/*meetName*/ ctx[4]);
    			t19 = space();
    			td2 = element("td");
    			td2.textContent = "Final Score";
    			t21 = space();
    			tr2 = element("tr");
    			td3 = element("td");
    			div18 = element("div");
    			div16 = element("div");
    			div16.textContent = "Site";
    			t23 = space();
    			div17 = element("div");
    			t24 = text(/*site*/ ctx[5]);
    			t25 = space();
    			td4 = element("td");
    			div21 = element("div");
    			div19 = element("div");
    			div19.textContent = "Date";
    			t27 = space();
    			div20 = element("div");
    			t28 = text(/*dateString*/ ctx[9]);
    			t29 = space();
    			tr3 = element("tr");
    			td5 = element("td");
    			td5.textContent = "Diver's Signature";
    			t31 = space();
    			td6 = element("td");
    			td6.textContent = "Coach's Signature";
    			t33 = space();
    			td7 = element("td");
    			td7.textContent = "Place (Official Divers Only) 1 2 3 4 5 6";
    			attr_dev(div0, "class", "title svelte-pkuf8v");
    			add_location(div0, file$4, 32, 10, 707);
    			attr_dev(div1, "contenteditable", "");
    			attr_dev(div1, "class", "answer svelte-pkuf8v");
    			if (/*name*/ ctx[0] === void 0) add_render_callback(() => /*div1_input_handler*/ ctx[15].call(div1));
    			add_location(div1, file$4, 33, 10, 748);
    			attr_dev(div2, "class", "svelte-pkuf8v");
    			add_location(div2, file$4, 31, 8, 690);
    			attr_dev(th0, "class", "tg-0pky col40 svelte-pkuf8v");
    			add_location(th0, file$4, 30, 6, 633);
    			attr_dev(div3, "class", "title svelte-pkuf8v");
    			add_location(div3, file$4, 46, 10, 1084);
    			attr_dev(div4, "contenteditable", "");
    			attr_dev(div4, "class", "answer svelte-pkuf8v");
    			if (/*ageGroup*/ ctx[1] === void 0) add_render_callback(() => /*div4_input_handler*/ ctx[17].call(div4));
    			add_location(div4, file$4, 47, 10, 1130);
    			attr_dev(div5, "class", "svelte-pkuf8v");
    			add_location(div5, file$4, 45, 8, 1067);
    			attr_dev(th1, "class", "tg-0pky col40 svelte-pkuf8v");
    			add_location(th1, file$4, 44, 6, 1006);
    			attr_dev(div6, "class", "answer svelte-pkuf8v");
    			add_location(div6, file$4, 63, 10, 1523);
    			attr_dev(div7, "class", "svelte-pkuf8v");
    			add_location(div7, file$4, 62, 8, 1506);
    			attr_dev(th2, "class", "tg-0pky col10 pointer svelte-pkuf8v");
    			toggle_class(th2, "circle", /*gender*/ ctx[2] === "male");
    			add_location(th2, file$4, 57, 6, 1359);
    			attr_dev(div8, "class", "answer svelte-pkuf8v");
    			add_location(div8, file$4, 72, 10, 1752);
    			attr_dev(div9, "class", "svelte-pkuf8v");
    			add_location(div9, file$4, 71, 8, 1735);
    			attr_dev(th3, "class", "tg-0lax pointer svelte-pkuf8v");
    			toggle_class(th3, "circle", /*gender*/ ctx[2] === "female");
    			add_location(th3, file$4, 66, 6, 1590);
    			add_location(tr0, file$4, 29, 4, 621);
    			add_location(thead, file$4, 28, 2, 608);
    			attr_dev(div10, "class", "title svelte-pkuf8v");
    			add_location(div10, file$4, 81, 10, 1912);
    			attr_dev(div11, "class", "answer svelte-pkuf8v");
    			add_location(div11, file$4, 82, 10, 1965);
    			attr_dev(div12, "class", "svelte-pkuf8v");
    			add_location(div12, file$4, 80, 8, 1895);
    			attr_dev(td0, "class", "tg-0pky svelte-pkuf8v");
    			add_location(td0, file$4, 79, 6, 1865);
    			attr_dev(div13, "class", "title svelte-pkuf8v");
    			add_location(div13, file$4, 87, 10, 2081);
    			attr_dev(div14, "class", "answer svelte-pkuf8v");
    			add_location(div14, file$4, 88, 10, 2122);
    			attr_dev(div15, "class", "svelte-pkuf8v");
    			add_location(div15, file$4, 86, 8, 2064);
    			attr_dev(td1, "class", "tg-0pky svelte-pkuf8v");
    			add_location(td1, file$4, 85, 6, 2034);
    			attr_dev(td2, "class", "tg-0pky col20");
    			attr_dev(td2, "colspan", "2");
    			attr_dev(td2, "rowspan", "2");
    			add_location(td2, file$4, 91, 6, 2195);
    			add_location(tr1, file$4, 78, 4, 1853);
    			attr_dev(div16, "class", "title svelte-pkuf8v");
    			add_location(div16, file$4, 96, 10, 2337);
    			attr_dev(div17, "class", "answer svelte-pkuf8v");
    			add_location(div17, file$4, 97, 10, 2378);
    			attr_dev(div18, "class", "svelte-pkuf8v");
    			add_location(div18, file$4, 95, 8, 2320);
    			attr_dev(td3, "class", "tg-0pky svelte-pkuf8v");
    			add_location(td3, file$4, 94, 6, 2290);
    			attr_dev(div19, "class", "title svelte-pkuf8v");
    			add_location(div19, file$4, 102, 10, 2494);
    			attr_dev(div20, "class", "answer svelte-pkuf8v");
    			add_location(div20, file$4, 103, 10, 2535);
    			attr_dev(div21, "class", "svelte-pkuf8v");
    			add_location(div21, file$4, 101, 8, 2477);
    			attr_dev(td4, "class", "tg-0pky svelte-pkuf8v");
    			add_location(td4, file$4, 100, 6, 2447);
    			add_location(tr2, file$4, 93, 4, 2278);
    			attr_dev(td5, "class", "tg-0pky");
    			add_location(td5, file$4, 108, 6, 2631);
    			attr_dev(td6, "class", "tg-0pky");
    			add_location(td6, file$4, 109, 6, 2681);
    			attr_dev(td7, "class", "center-txt tg-0pky");
    			attr_dev(td7, "colspan", "2");
    			add_location(td7, file$4, 110, 6, 2731);
    			add_location(tr3, file$4, 107, 4, 2619);
    			add_location(tbody, file$4, 77, 2, 1840);
    			attr_dev(table, "class", "diverInfoTable tg");
    			add_location(table, file$4, 27, 0, 571);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);
    			append_dev(thead, tr0);
    			append_dev(tr0, th0);
    			append_dev(th0, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, t2);
    			/*div1_binding*/ ctx[14](div1);

    			if (/*name*/ ctx[0] !== void 0) {
    				div1.innerHTML = /*name*/ ctx[0];
    			}

    			append_dev(tr0, t3);
    			append_dev(tr0, th1);
    			append_dev(th1, div5);
    			append_dev(div5, div3);
    			append_dev(div5, t5);
    			append_dev(div5, div4);
    			append_dev(div4, t6);
    			/*div4_binding*/ ctx[16](div4);

    			if (/*ageGroup*/ ctx[1] !== void 0) {
    				div4.innerHTML = /*ageGroup*/ ctx[1];
    			}

    			append_dev(tr0, t7);
    			append_dev(tr0, th2);
    			append_dev(th2, div7);
    			append_dev(div7, div6);
    			append_dev(tr0, t9);
    			append_dev(tr0, th3);
    			append_dev(th3, div9);
    			append_dev(div9, div8);
    			append_dev(table, t11);
    			append_dev(table, tbody);
    			append_dev(tbody, tr1);
    			append_dev(tr1, td0);
    			append_dev(td0, div12);
    			append_dev(div12, div10);
    			append_dev(div12, t13);
    			append_dev(div12, div11);
    			append_dev(div11, t14);
    			append_dev(tr1, t15);
    			append_dev(tr1, td1);
    			append_dev(td1, div15);
    			append_dev(div15, div13);
    			append_dev(div15, t17);
    			append_dev(div15, div14);
    			append_dev(div14, t18);
    			append_dev(tr1, t19);
    			append_dev(tr1, td2);
    			append_dev(tbody, t21);
    			append_dev(tbody, tr2);
    			append_dev(tr2, td3);
    			append_dev(td3, div18);
    			append_dev(div18, div16);
    			append_dev(div18, t23);
    			append_dev(div18, div17);
    			append_dev(div17, t24);
    			append_dev(tr2, t25);
    			append_dev(tr2, td4);
    			append_dev(td4, div21);
    			append_dev(div21, div19);
    			append_dev(div21, t27);
    			append_dev(div21, div20);
    			append_dev(div20, t28);
    			append_dev(tbody, t29);
    			append_dev(tbody, tr3);
    			append_dev(tr3, td5);
    			append_dev(tr3, t31);
    			append_dev(tr3, td6);
    			append_dev(tr3, t33);
    			append_dev(tr3, td7);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "input", /*div1_input_handler*/ ctx[15]),
    					listen_dev(
    						div1,
    						"input",
    						function () {
    							if (is_function(/*updateName*/ ctx[6](/*name*/ ctx[0]))) /*updateName*/ ctx[6](/*name*/ ctx[0]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(th0, "click", /*focusName*/ ctx[10], false, false, false),
    					listen_dev(div4, "input", /*div4_input_handler*/ ctx[17]),
    					listen_dev(th1, "click", /*focusAgeGroup*/ ctx[11], false, false, false),
    					listen_dev(th2, "click", /*click_handler*/ ctx[18], false, false, false),
    					listen_dev(th3, "click", /*click_handler_1*/ ctx[19], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if (dirty & /*name*/ 1) set_data_dev(t2, /*name*/ ctx[0]);

    			if (dirty & /*name*/ 1 && /*name*/ ctx[0] !== div1.innerHTML) {
    				div1.innerHTML = /*name*/ ctx[0];
    			}

    			if (dirty & /*ageGroup*/ 2) set_data_dev(t6, /*ageGroup*/ ctx[1]);

    			if (dirty & /*ageGroup*/ 2 && /*ageGroup*/ ctx[1] !== div4.innerHTML) {
    				div4.innerHTML = /*ageGroup*/ ctx[1];
    			}

    			if (dirty & /*gender*/ 4) {
    				toggle_class(th2, "circle", /*gender*/ ctx[2] === "male");
    			}

    			if (dirty & /*gender*/ 4) {
    				toggle_class(th3, "circle", /*gender*/ ctx[2] === "female");
    			}

    			if (dirty & /*club*/ 8) set_data_dev(t14, /*club*/ ctx[3]);
    			if (dirty & /*meetName*/ 16) set_data_dev(t18, /*meetName*/ ctx[4]);
    			if (dirty & /*site*/ 32) set_data_dev(t24, /*site*/ ctx[5]);
    			if (dirty & /*dateString*/ 512) set_data_dev(t28, /*dateString*/ ctx[9]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			/*div1_binding*/ ctx[14](null);
    			/*div4_binding*/ ctx[16](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let dateObj;
    	let dateString;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SheetHeader", slots, []);
    	let { name = "" } = $$props;
    	let { ageGroup = "" } = $$props;
    	let { gender } = $$props;
    	let { club } = $$props;
    	let { meetName } = $$props;
    	let { site } = $$props;

    	let { updateName = () => {
    		
    	} } = $$props;

    	let { date } = $$props;
    	let nameDiv;
    	let ageGroupDiv;

    	const focusName = () => {
    		nameDiv.focus();
    	};

    	const focusAgeGroup = () => {
    		ageGroupDiv.focus();
    	};

    	const writable_props = ["name", "ageGroup", "gender", "club", "meetName", "site", "updateName", "date"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SheetHeader> was created with unknown prop '${key}'`);
    	});

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			nameDiv = $$value;
    			$$invalidate(7, nameDiv);
    		});
    	}

    	function div1_input_handler() {
    		name = this.innerHTML;
    		$$invalidate(0, name);
    	}

    	function div4_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			ageGroupDiv = $$value;
    			$$invalidate(8, ageGroupDiv);
    		});
    	}

    	function div4_input_handler() {
    		ageGroup = this.innerHTML;
    		$$invalidate(1, ageGroup);
    	}

    	const click_handler = () => $$invalidate(2, gender = "male");
    	const click_handler_1 = () => $$invalidate(2, gender = "female");

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("ageGroup" in $$props) $$invalidate(1, ageGroup = $$props.ageGroup);
    		if ("gender" in $$props) $$invalidate(2, gender = $$props.gender);
    		if ("club" in $$props) $$invalidate(3, club = $$props.club);
    		if ("meetName" in $$props) $$invalidate(4, meetName = $$props.meetName);
    		if ("site" in $$props) $$invalidate(5, site = $$props.site);
    		if ("updateName" in $$props) $$invalidate(6, updateName = $$props.updateName);
    		if ("date" in $$props) $$invalidate(12, date = $$props.date);
    	};

    	$$self.$capture_state = () => ({
    		name,
    		ageGroup,
    		gender,
    		club,
    		meetName,
    		site,
    		updateName,
    		date,
    		nameDiv,
    		ageGroupDiv,
    		focusName,
    		focusAgeGroup,
    		dateObj,
    		dateString
    	});

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("ageGroup" in $$props) $$invalidate(1, ageGroup = $$props.ageGroup);
    		if ("gender" in $$props) $$invalidate(2, gender = $$props.gender);
    		if ("club" in $$props) $$invalidate(3, club = $$props.club);
    		if ("meetName" in $$props) $$invalidate(4, meetName = $$props.meetName);
    		if ("site" in $$props) $$invalidate(5, site = $$props.site);
    		if ("updateName" in $$props) $$invalidate(6, updateName = $$props.updateName);
    		if ("date" in $$props) $$invalidate(12, date = $$props.date);
    		if ("nameDiv" in $$props) $$invalidate(7, nameDiv = $$props.nameDiv);
    		if ("ageGroupDiv" in $$props) $$invalidate(8, ageGroupDiv = $$props.ageGroupDiv);
    		if ("dateObj" in $$props) $$invalidate(13, dateObj = $$props.dateObj);
    		if ("dateString" in $$props) $$invalidate(9, dateString = $$props.dateString);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*date*/ 4096) {
    			$$invalidate(13, dateObj = new Date(date));
    		}

    		if ($$self.$$.dirty & /*dateObj*/ 8192) {
    			dateObj.setDate(dateObj.getDate() + 1);
    		}

    		if ($$self.$$.dirty & /*dateObj*/ 8192) {
    			$$invalidate(9, dateString = dateObj.toLocaleString().substring(0, dateObj.toLocaleString().indexOf(",")));
    		}
    	};

    	return [
    		name,
    		ageGroup,
    		gender,
    		club,
    		meetName,
    		site,
    		updateName,
    		nameDiv,
    		ageGroupDiv,
    		dateString,
    		focusName,
    		focusAgeGroup,
    		date,
    		dateObj,
    		div1_binding,
    		div1_input_handler,
    		div4_binding,
    		div4_input_handler,
    		click_handler,
    		click_handler_1
    	];
    }

    class SheetHeader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			name: 0,
    			ageGroup: 1,
    			gender: 2,
    			club: 3,
    			meetName: 4,
    			site: 5,
    			updateName: 6,
    			date: 12
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SheetHeader",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*gender*/ ctx[2] === undefined && !("gender" in props)) {
    			console.warn("<SheetHeader> was created without expected prop 'gender'");
    		}

    		if (/*club*/ ctx[3] === undefined && !("club" in props)) {
    			console.warn("<SheetHeader> was created without expected prop 'club'");
    		}

    		if (/*meetName*/ ctx[4] === undefined && !("meetName" in props)) {
    			console.warn("<SheetHeader> was created without expected prop 'meetName'");
    		}

    		if (/*site*/ ctx[5] === undefined && !("site" in props)) {
    			console.warn("<SheetHeader> was created without expected prop 'site'");
    		}

    		if (/*date*/ ctx[12] === undefined && !("date" in props)) {
    			console.warn("<SheetHeader> was created without expected prop 'date'");
    		}
    	}

    	get name() {
    		throw new Error("<SheetHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<SheetHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ageGroup() {
    		throw new Error("<SheetHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ageGroup(value) {
    		throw new Error("<SheetHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get gender() {
    		throw new Error("<SheetHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gender(value) {
    		throw new Error("<SheetHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get club() {
    		throw new Error("<SheetHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set club(value) {
    		throw new Error("<SheetHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get meetName() {
    		throw new Error("<SheetHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set meetName(value) {
    		throw new Error("<SheetHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get site() {
    		throw new Error("<SheetHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set site(value) {
    		throw new Error("<SheetHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get updateName() {
    		throw new Error("<SheetHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set updateName(value) {
    		throw new Error("<SheetHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get date() {
    		throw new Error("<SheetHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set date(value) {
    		throw new Error("<SheetHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Footer.svelte generated by Svelte v3.38.3 */

    const file$3 = "src\\components\\Footer.svelte";

    function create_fragment$3(ctx) {
    	let br;
    	let t0;
    	let div2;
    	let div0;
    	let t2;
    	let div1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			br = element("br");
    			t0 = space();
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "____ Official Diver (Points Awarded)";
    			t2 = space();
    			div1 = element("div");
    			div1.textContent = "____ UnOfficial Diver (No Points Awarded)";
    			add_location(br, file$3, 4, 0, 52);
    			attr_dev(div0, "class", "pointer svelte-1upy311");
    			toggle_class(div0, "x", /*official*/ ctx[0].toLowerCase() === "official");
    			add_location(div0, file$3, 7, 2, 89);
    			attr_dev(div1, "class", "pointer svelte-1upy311");
    			toggle_class(div1, "x", /*official*/ ctx[0].toLowerCase() === "unofficial");
    			add_location(div1, file$3, 14, 2, 274);
    			attr_dev(div2, "class", "container svelte-1upy311");
    			add_location(div2, file$3, 6, 0, 62);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, br, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t2);
    			append_dev(div2, div1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*click_handler*/ ctx[1], false, false, false),
    					listen_dev(div1, "click", /*click_handler_1*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*official*/ 1) {
    				toggle_class(div0, "x", /*official*/ ctx[0].toLowerCase() === "official");
    			}

    			if (dirty & /*official*/ 1) {
    				toggle_class(div1, "x", /*official*/ ctx[0].toLowerCase() === "unofficial");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	let { official = "" } = $$props;
    	const writable_props = ["official"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, official = "official");
    	const click_handler_1 = () => $$invalidate(0, official = "unofficial");

    	$$self.$$set = $$props => {
    		if ("official" in $$props) $$invalidate(0, official = $$props.official);
    	};

    	$$self.$capture_state = () => ({ official });

    	$$self.$inject_state = $$props => {
    		if ("official" in $$props) $$invalidate(0, official = $$props.official);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [official, click_handler, click_handler_1];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { official: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get official() {
    		throw new Error("<Footer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set official(value) {
    		throw new Error("<Footer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\DivingSheet.svelte generated by Svelte v3.38.3 */
    const file$2 = "src\\components\\DivingSheet.svelte";

    function create_fragment$2(ctx) {
    	let div5;
    	let div0;
    	let span;
    	let t1;
    	let input;
    	let t2;
    	let div3;
    	let div1;
    	let t4;
    	let div2;
    	let t5;
    	let sheetheader;
    	let t6;
    	let br;
    	let t7;
    	let table;
    	let divetablehead;
    	let t8;
    	let divetablerow0;
    	let t9;
    	let divetablerow1;
    	let t10;
    	let divetablerow2;
    	let t11;
    	let divetablerow3;
    	let t12;
    	let divetablerow4;
    	let t13;
    	let divetablerow5;
    	let t14;
    	let divetablerow6;
    	let t15;
    	let divetablerow7;
    	let t16;
    	let footer;
    	let t17;
    	let div4;
    	let current;
    	let mounted;
    	let dispose;

    	const sheetheader_spread_levels = [
    		{ updateName: /*updateName*/ ctx[12] },
    		/*headerData*/ ctx[11],
    		/*diverData*/ ctx[14]
    	];

    	let sheetheader_props = {};

    	for (let i = 0; i < sheetheader_spread_levels.length; i += 1) {
    		sheetheader_props = assign(sheetheader_props, sheetheader_spread_levels[i]);
    	}

    	sheetheader = new SheetHeader({ props: sheetheader_props, $$inline: true });
    	divetablehead = new DiveTableHead({ $$inline: true });

    	divetablerow0 = new DiveTableRow({
    			props: {
    				firstRow: true,
    				row: "1",
    				numberPos: /*Dive_1*/ ctx[1]
    			},
    			$$inline: true
    		});

    	divetablerow1 = new DiveTableRow({
    			props: { row: "2", numberPos: /*Dive_2*/ ctx[2] },
    			$$inline: true
    		});

    	divetablerow2 = new DiveTableRow({
    			props: { row: "3", numberPos: /*Dive_3*/ ctx[3] },
    			$$inline: true
    		});

    	divetablerow3 = new DiveTableRow({
    			props: { row: "4", numberPos: /*Dive_4*/ ctx[4] },
    			$$inline: true
    		});

    	divetablerow4 = new DiveTableRow({
    			props: { row: "5", numberPos: /*Dive_5*/ ctx[5] },
    			$$inline: true
    		});

    	divetablerow5 = new DiveTableRow({
    			props: { row: "6", numberPos: /*Dive_6*/ ctx[6] },
    			$$inline: true
    		});

    	divetablerow6 = new DiveTableRow({
    			props: { row: "7", numberPos: /*Dive_7*/ ctx[7] },
    			$$inline: true
    		});

    	divetablerow7 = new DiveTableRow({
    			props: { row: "8", numberPos: /*Dive_8*/ ctx[8] },
    			$$inline: true
    		});

    	footer = new Footer({
    			props: {
    				official: /*Official_Unofficial*/ ctx[10].toLowerCase()
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div0 = element("div");
    			span = element("span");
    			span.textContent = "Print This One:";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			div3 = element("div");
    			div1 = element("div");
    			div1.textContent = "Order of Diving";
    			t4 = space();
    			div2 = element("div");
    			t5 = space();
    			create_component(sheetheader.$$.fragment);
    			t6 = space();
    			br = element("br");
    			t7 = space();
    			table = element("table");
    			create_component(divetablehead.$$.fragment);
    			t8 = space();
    			create_component(divetablerow0.$$.fragment);
    			t9 = space();
    			create_component(divetablerow1.$$.fragment);
    			t10 = space();
    			create_component(divetablerow2.$$.fragment);
    			t11 = space();
    			create_component(divetablerow3.$$.fragment);
    			t12 = space();
    			create_component(divetablerow4.$$.fragment);
    			t13 = space();
    			create_component(divetablerow5.$$.fragment);
    			t14 = space();
    			create_component(divetablerow6.$$.fragment);
    			t15 = space();
    			create_component(divetablerow7.$$.fragment);
    			t16 = space();
    			create_component(footer.$$.fragment);
    			t17 = space();
    			div4 = element("div");
    			add_location(span, file$2, 41, 4, 891);
    			attr_dev(input, "type", "checkbox");
    			add_location(input, file$2, 42, 4, 926);
    			attr_dev(div0, "id", /*Name*/ ctx[9]);
    			attr_dev(div0, "class", "hidePrint");
    			add_location(div0, file$2, 40, 2, 852);
    			attr_dev(div1, "class", "orderOfDiving svelte-1jhrscn");
    			add_location(div1, file$2, 45, 4, 1012);
    			attr_dev(div2, "class", "title svelte-1jhrscn");
    			attr_dev(div2, "contenteditable", "");
    			if (/*formTitle*/ ctx[13] === void 0) add_render_callback(() => /*div2_input_handler*/ ctx[18].call(div2));
    			add_location(div2, file$2, 46, 4, 1066);
    			attr_dev(div3, "class", "header svelte-1jhrscn");
    			add_location(div3, file$2, 44, 2, 986);
    			add_location(br, file$2, 51, 2, 1211);
    			attr_dev(table, "class", "tg divesTable");
    			add_location(table, file$2, 53, 2, 1223);
    			set_style(div4, "page-break-after", "always");
    			add_location(div4, file$2, 67, 2, 1755);
    			toggle_class(div5, "hidePrint", !/*print*/ ctx[0]);
    			add_location(div5, file$2, 39, 0, 818);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div0, span);
    			append_dev(div0, t1);
    			append_dev(div0, input);
    			input.checked = /*print*/ ctx[0];
    			append_dev(div5, t2);
    			append_dev(div5, div3);
    			append_dev(div3, div1);
    			append_dev(div3, t4);
    			append_dev(div3, div2);

    			if (/*formTitle*/ ctx[13] !== void 0) {
    				div2.innerHTML = /*formTitle*/ ctx[13];
    			}

    			append_dev(div5, t5);
    			mount_component(sheetheader, div5, null);
    			append_dev(div5, t6);
    			append_dev(div5, br);
    			append_dev(div5, t7);
    			append_dev(div5, table);
    			mount_component(divetablehead, table, null);
    			append_dev(table, t8);
    			mount_component(divetablerow0, table, null);
    			append_dev(table, t9);
    			mount_component(divetablerow1, table, null);
    			append_dev(table, t10);
    			mount_component(divetablerow2, table, null);
    			append_dev(table, t11);
    			mount_component(divetablerow3, table, null);
    			append_dev(table, t12);
    			mount_component(divetablerow4, table, null);
    			append_dev(table, t13);
    			mount_component(divetablerow5, table, null);
    			append_dev(table, t14);
    			mount_component(divetablerow6, table, null);
    			append_dev(table, t15);
    			mount_component(divetablerow7, table, null);
    			append_dev(div5, t16);
    			mount_component(footer, div5, null);
    			append_dev(div5, t17);
    			append_dev(div5, div4);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_handler*/ ctx[17]),
    					listen_dev(div2, "input", /*div2_input_handler*/ ctx[18])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*print*/ 1) {
    				input.checked = /*print*/ ctx[0];
    			}

    			if (!current || dirty & /*Name*/ 512) {
    				attr_dev(div0, "id", /*Name*/ ctx[9]);
    			}

    			if (dirty & /*formTitle*/ 8192 && /*formTitle*/ ctx[13] !== div2.innerHTML) {
    				div2.innerHTML = /*formTitle*/ ctx[13];
    			}

    			const sheetheader_changes = (dirty & /*updateName, headerData, diverData*/ 22528)
    			? get_spread_update(sheetheader_spread_levels, [
    					dirty & /*updateName*/ 4096 && { updateName: /*updateName*/ ctx[12] },
    					dirty & /*headerData*/ 2048 && get_spread_object(/*headerData*/ ctx[11]),
    					dirty & /*diverData*/ 16384 && get_spread_object(/*diverData*/ ctx[14])
    				])
    			: {};

    			sheetheader.$set(sheetheader_changes);
    			const divetablerow0_changes = {};
    			if (dirty & /*Dive_1*/ 2) divetablerow0_changes.numberPos = /*Dive_1*/ ctx[1];
    			divetablerow0.$set(divetablerow0_changes);
    			const divetablerow1_changes = {};
    			if (dirty & /*Dive_2*/ 4) divetablerow1_changes.numberPos = /*Dive_2*/ ctx[2];
    			divetablerow1.$set(divetablerow1_changes);
    			const divetablerow2_changes = {};
    			if (dirty & /*Dive_3*/ 8) divetablerow2_changes.numberPos = /*Dive_3*/ ctx[3];
    			divetablerow2.$set(divetablerow2_changes);
    			const divetablerow3_changes = {};
    			if (dirty & /*Dive_4*/ 16) divetablerow3_changes.numberPos = /*Dive_4*/ ctx[4];
    			divetablerow3.$set(divetablerow3_changes);
    			const divetablerow4_changes = {};
    			if (dirty & /*Dive_5*/ 32) divetablerow4_changes.numberPos = /*Dive_5*/ ctx[5];
    			divetablerow4.$set(divetablerow4_changes);
    			const divetablerow5_changes = {};
    			if (dirty & /*Dive_6*/ 64) divetablerow5_changes.numberPos = /*Dive_6*/ ctx[6];
    			divetablerow5.$set(divetablerow5_changes);
    			const divetablerow6_changes = {};
    			if (dirty & /*Dive_7*/ 128) divetablerow6_changes.numberPos = /*Dive_7*/ ctx[7];
    			divetablerow6.$set(divetablerow6_changes);
    			const divetablerow7_changes = {};
    			if (dirty & /*Dive_8*/ 256) divetablerow7_changes.numberPos = /*Dive_8*/ ctx[8];
    			divetablerow7.$set(divetablerow7_changes);
    			const footer_changes = {};
    			if (dirty & /*Official_Unofficial*/ 1024) footer_changes.official = /*Official_Unofficial*/ ctx[10].toLowerCase();
    			footer.$set(footer_changes);

    			if (dirty & /*print*/ 1) {
    				toggle_class(div5, "hidePrint", !/*print*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sheetheader.$$.fragment, local);
    			transition_in(divetablehead.$$.fragment, local);
    			transition_in(divetablerow0.$$.fragment, local);
    			transition_in(divetablerow1.$$.fragment, local);
    			transition_in(divetablerow2.$$.fragment, local);
    			transition_in(divetablerow3.$$.fragment, local);
    			transition_in(divetablerow4.$$.fragment, local);
    			transition_in(divetablerow5.$$.fragment, local);
    			transition_in(divetablerow6.$$.fragment, local);
    			transition_in(divetablerow7.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sheetheader.$$.fragment, local);
    			transition_out(divetablehead.$$.fragment, local);
    			transition_out(divetablerow0.$$.fragment, local);
    			transition_out(divetablerow1.$$.fragment, local);
    			transition_out(divetablerow2.$$.fragment, local);
    			transition_out(divetablerow3.$$.fragment, local);
    			transition_out(divetablerow4.$$.fragment, local);
    			transition_out(divetablerow5.$$.fragment, local);
    			transition_out(divetablerow6.$$.fragment, local);
    			transition_out(divetablerow7.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_component(sheetheader);
    			destroy_component(divetablehead);
    			destroy_component(divetablerow0);
    			destroy_component(divetablerow1);
    			destroy_component(divetablerow2);
    			destroy_component(divetablerow3);
    			destroy_component(divetablerow4);
    			destroy_component(divetablerow5);
    			destroy_component(divetablerow6);
    			destroy_component(divetablerow7);
    			destroy_component(footer);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("DivingSheet", slots, []);
    	let { Age_Group } = $$props;
    	let { Dive_1 } = $$props;
    	let { Dive_2 } = $$props;
    	let { Dive_3 } = $$props;
    	let { Dive_4 } = $$props;
    	let { Dive_5 } = $$props;
    	let { Dive_6 } = $$props;
    	let { Dive_7 } = $$props;
    	let { Dive_8 } = $$props;
    	let { Name } = $$props;
    	let { Official_Unofficial = "" } = $$props;
    	let { Gender } = $$props;
    	let { headerData } = $$props;
    	let formTitle = "Suburban Swim League <br /> Diving Form";
    	let diverData;
    	let { updateName } = $$props;
    	let { print = true } = $$props;

    	const writable_props = [
    		"Age_Group",
    		"Dive_1",
    		"Dive_2",
    		"Dive_3",
    		"Dive_4",
    		"Dive_5",
    		"Dive_6",
    		"Dive_7",
    		"Dive_8",
    		"Name",
    		"Official_Unofficial",
    		"Gender",
    		"headerData",
    		"updateName",
    		"print"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DivingSheet> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		print = this.checked;
    		$$invalidate(0, print);
    	}

    	function div2_input_handler() {
    		formTitle = this.innerHTML;
    		$$invalidate(13, formTitle);
    	}

    	$$self.$$set = $$props => {
    		if ("Age_Group" in $$props) $$invalidate(15, Age_Group = $$props.Age_Group);
    		if ("Dive_1" in $$props) $$invalidate(1, Dive_1 = $$props.Dive_1);
    		if ("Dive_2" in $$props) $$invalidate(2, Dive_2 = $$props.Dive_2);
    		if ("Dive_3" in $$props) $$invalidate(3, Dive_3 = $$props.Dive_3);
    		if ("Dive_4" in $$props) $$invalidate(4, Dive_4 = $$props.Dive_4);
    		if ("Dive_5" in $$props) $$invalidate(5, Dive_5 = $$props.Dive_5);
    		if ("Dive_6" in $$props) $$invalidate(6, Dive_6 = $$props.Dive_6);
    		if ("Dive_7" in $$props) $$invalidate(7, Dive_7 = $$props.Dive_7);
    		if ("Dive_8" in $$props) $$invalidate(8, Dive_8 = $$props.Dive_8);
    		if ("Name" in $$props) $$invalidate(9, Name = $$props.Name);
    		if ("Official_Unofficial" in $$props) $$invalidate(10, Official_Unofficial = $$props.Official_Unofficial);
    		if ("Gender" in $$props) $$invalidate(16, Gender = $$props.Gender);
    		if ("headerData" in $$props) $$invalidate(11, headerData = $$props.headerData);
    		if ("updateName" in $$props) $$invalidate(12, updateName = $$props.updateName);
    		if ("print" in $$props) $$invalidate(0, print = $$props.print);
    	};

    	$$self.$capture_state = () => ({
    		DiveTableHead,
    		DiveTableRow,
    		SheetHeader,
    		Footer,
    		Age_Group,
    		Dive_1,
    		Dive_2,
    		Dive_3,
    		Dive_4,
    		Dive_5,
    		Dive_6,
    		Dive_7,
    		Dive_8,
    		Name,
    		Official_Unofficial,
    		Gender,
    		headerData,
    		formTitle,
    		diverData,
    		updateName,
    		print
    	});

    	$$self.$inject_state = $$props => {
    		if ("Age_Group" in $$props) $$invalidate(15, Age_Group = $$props.Age_Group);
    		if ("Dive_1" in $$props) $$invalidate(1, Dive_1 = $$props.Dive_1);
    		if ("Dive_2" in $$props) $$invalidate(2, Dive_2 = $$props.Dive_2);
    		if ("Dive_3" in $$props) $$invalidate(3, Dive_3 = $$props.Dive_3);
    		if ("Dive_4" in $$props) $$invalidate(4, Dive_4 = $$props.Dive_4);
    		if ("Dive_5" in $$props) $$invalidate(5, Dive_5 = $$props.Dive_5);
    		if ("Dive_6" in $$props) $$invalidate(6, Dive_6 = $$props.Dive_6);
    		if ("Dive_7" in $$props) $$invalidate(7, Dive_7 = $$props.Dive_7);
    		if ("Dive_8" in $$props) $$invalidate(8, Dive_8 = $$props.Dive_8);
    		if ("Name" in $$props) $$invalidate(9, Name = $$props.Name);
    		if ("Official_Unofficial" in $$props) $$invalidate(10, Official_Unofficial = $$props.Official_Unofficial);
    		if ("Gender" in $$props) $$invalidate(16, Gender = $$props.Gender);
    		if ("headerData" in $$props) $$invalidate(11, headerData = $$props.headerData);
    		if ("formTitle" in $$props) $$invalidate(13, formTitle = $$props.formTitle);
    		if ("diverData" in $$props) $$invalidate(14, diverData = $$props.diverData);
    		if ("updateName" in $$props) $$invalidate(12, updateName = $$props.updateName);
    		if ("print" in $$props) $$invalidate(0, print = $$props.print);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*Gender, Age_Group, Name*/ 98816) {
    			if (Gender) {
    				$$invalidate(14, diverData = {
    					ageGroup: Age_Group,
    					name: Name,
    					gender: Gender.toLowerCase()
    				});
    			}
    		}
    	};

    	return [
    		print,
    		Dive_1,
    		Dive_2,
    		Dive_3,
    		Dive_4,
    		Dive_5,
    		Dive_6,
    		Dive_7,
    		Dive_8,
    		Name,
    		Official_Unofficial,
    		headerData,
    		updateName,
    		formTitle,
    		diverData,
    		Age_Group,
    		Gender,
    		input_change_handler,
    		div2_input_handler
    	];
    }

    class DivingSheet extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			Age_Group: 15,
    			Dive_1: 1,
    			Dive_2: 2,
    			Dive_3: 3,
    			Dive_4: 4,
    			Dive_5: 5,
    			Dive_6: 6,
    			Dive_7: 7,
    			Dive_8: 8,
    			Name: 9,
    			Official_Unofficial: 10,
    			Gender: 16,
    			headerData: 11,
    			updateName: 12,
    			print: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DivingSheet",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*Age_Group*/ ctx[15] === undefined && !("Age_Group" in props)) {
    			console.warn("<DivingSheet> was created without expected prop 'Age_Group'");
    		}

    		if (/*Dive_1*/ ctx[1] === undefined && !("Dive_1" in props)) {
    			console.warn("<DivingSheet> was created without expected prop 'Dive_1'");
    		}

    		if (/*Dive_2*/ ctx[2] === undefined && !("Dive_2" in props)) {
    			console.warn("<DivingSheet> was created without expected prop 'Dive_2'");
    		}

    		if (/*Dive_3*/ ctx[3] === undefined && !("Dive_3" in props)) {
    			console.warn("<DivingSheet> was created without expected prop 'Dive_3'");
    		}

    		if (/*Dive_4*/ ctx[4] === undefined && !("Dive_4" in props)) {
    			console.warn("<DivingSheet> was created without expected prop 'Dive_4'");
    		}

    		if (/*Dive_5*/ ctx[5] === undefined && !("Dive_5" in props)) {
    			console.warn("<DivingSheet> was created without expected prop 'Dive_5'");
    		}

    		if (/*Dive_6*/ ctx[6] === undefined && !("Dive_6" in props)) {
    			console.warn("<DivingSheet> was created without expected prop 'Dive_6'");
    		}

    		if (/*Dive_7*/ ctx[7] === undefined && !("Dive_7" in props)) {
    			console.warn("<DivingSheet> was created without expected prop 'Dive_7'");
    		}

    		if (/*Dive_8*/ ctx[8] === undefined && !("Dive_8" in props)) {
    			console.warn("<DivingSheet> was created without expected prop 'Dive_8'");
    		}

    		if (/*Name*/ ctx[9] === undefined && !("Name" in props)) {
    			console.warn("<DivingSheet> was created without expected prop 'Name'");
    		}

    		if (/*Gender*/ ctx[16] === undefined && !("Gender" in props)) {
    			console.warn("<DivingSheet> was created without expected prop 'Gender'");
    		}

    		if (/*headerData*/ ctx[11] === undefined && !("headerData" in props)) {
    			console.warn("<DivingSheet> was created without expected prop 'headerData'");
    		}

    		if (/*updateName*/ ctx[12] === undefined && !("updateName" in props)) {
    			console.warn("<DivingSheet> was created without expected prop 'updateName'");
    		}
    	}

    	get Age_Group() {
    		throw new Error("<DivingSheet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Age_Group(value) {
    		throw new Error("<DivingSheet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get Dive_1() {
    		throw new Error("<DivingSheet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Dive_1(value) {
    		throw new Error("<DivingSheet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get Dive_2() {
    		throw new Error("<DivingSheet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Dive_2(value) {
    		throw new Error("<DivingSheet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get Dive_3() {
    		throw new Error("<DivingSheet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Dive_3(value) {
    		throw new Error("<DivingSheet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get Dive_4() {
    		throw new Error("<DivingSheet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Dive_4(value) {
    		throw new Error("<DivingSheet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get Dive_5() {
    		throw new Error("<DivingSheet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Dive_5(value) {
    		throw new Error("<DivingSheet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get Dive_6() {
    		throw new Error("<DivingSheet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Dive_6(value) {
    		throw new Error("<DivingSheet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get Dive_7() {
    		throw new Error("<DivingSheet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Dive_7(value) {
    		throw new Error("<DivingSheet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get Dive_8() {
    		throw new Error("<DivingSheet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Dive_8(value) {
    		throw new Error("<DivingSheet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get Name() {
    		throw new Error("<DivingSheet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Name(value) {
    		throw new Error("<DivingSheet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get Official_Unofficial() {
    		throw new Error("<DivingSheet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Official_Unofficial(value) {
    		throw new Error("<DivingSheet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get Gender() {
    		throw new Error("<DivingSheet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set Gender(value) {
    		throw new Error("<DivingSheet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get headerData() {
    		throw new Error("<DivingSheet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set headerData(value) {
    		throw new Error("<DivingSheet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get updateName() {
    		throw new Error("<DivingSheet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set updateName(value) {
    		throw new Error("<DivingSheet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get print() {
    		throw new Error("<DivingSheet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set print(value) {
    		throw new Error("<DivingSheet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    /* @license
    Papa Parse
    v5.3.1
    https://github.com/mholt/PapaParse
    License: MIT
    */

    var papaparse_min = createCommonjsModule(function (module, exports) {
    !function(e,t){module.exports=t();}(commonjsGlobal,function s(){var f="undefined"!=typeof self?self:"undefined"!=typeof window?window:void 0!==f?f:{};var n=!f.document&&!!f.postMessage,o=n&&/blob:/i.test((f.location||{}).protocol),a={},h=0,b={parse:function(e,t){var i=(t=t||{}).dynamicTyping||!1;M(i)&&(t.dynamicTypingFunction=i,i={});if(t.dynamicTyping=i,t.transform=!!M(t.transform)&&t.transform,t.worker&&b.WORKERS_SUPPORTED){var r=function(){if(!b.WORKERS_SUPPORTED)return !1;var e=(i=f.URL||f.webkitURL||null,r=s.toString(),b.BLOB_URL||(b.BLOB_URL=i.createObjectURL(new Blob(["(",r,")();"],{type:"text/javascript"})))),t=new f.Worker(e);var i,r;return t.onmessage=_,t.id=h++,a[t.id]=t}();return r.userStep=t.step,r.userChunk=t.chunk,r.userComplete=t.complete,r.userError=t.error,t.step=M(t.step),t.chunk=M(t.chunk),t.complete=M(t.complete),t.error=M(t.error),delete t.worker,void r.postMessage({input:e,config:t,workerId:r.id})}var n=null;b.NODE_STREAM_INPUT,"string"==typeof e?n=t.download?new l(t):new p(t):!0===e.readable&&M(e.read)&&M(e.on)?n=new g(t):(f.File&&e instanceof File||e instanceof Object)&&(n=new c(t));return n.stream(e)},unparse:function(e,t){var n=!1,_=!0,m=",",y="\r\n",s='"',a=s+s,i=!1,r=null,o=!1;!function(){if("object"!=typeof t)return;"string"!=typeof t.delimiter||b.BAD_DELIMITERS.filter(function(e){return -1!==t.delimiter.indexOf(e)}).length||(m=t.delimiter);("boolean"==typeof t.quotes||"function"==typeof t.quotes||Array.isArray(t.quotes))&&(n=t.quotes);"boolean"!=typeof t.skipEmptyLines&&"string"!=typeof t.skipEmptyLines||(i=t.skipEmptyLines);"string"==typeof t.newline&&(y=t.newline);"string"==typeof t.quoteChar&&(s=t.quoteChar);"boolean"==typeof t.header&&(_=t.header);if(Array.isArray(t.columns)){if(0===t.columns.length)throw new Error("Option columns is empty");r=t.columns;}void 0!==t.escapeChar&&(a=t.escapeChar+s);"boolean"==typeof t.escapeFormulae&&(o=t.escapeFormulae);}();var h=new RegExp(j(s),"g");"string"==typeof e&&(e=JSON.parse(e));if(Array.isArray(e)){if(!e.length||Array.isArray(e[0]))return u(null,e,i);if("object"==typeof e[0])return u(r||Object.keys(e[0]),e,i)}else if("object"==typeof e)return "string"==typeof e.data&&(e.data=JSON.parse(e.data)),Array.isArray(e.data)&&(e.fields||(e.fields=e.meta&&e.meta.fields),e.fields||(e.fields=Array.isArray(e.data[0])?e.fields:"object"==typeof e.data[0]?Object.keys(e.data[0]):[]),Array.isArray(e.data[0])||"object"==typeof e.data[0]||(e.data=[e.data])),u(e.fields||[],e.data||[],i);throw new Error("Unable to serialize unrecognized input");function u(e,t,i){var r="";"string"==typeof e&&(e=JSON.parse(e)),"string"==typeof t&&(t=JSON.parse(t));var n=Array.isArray(e)&&0<e.length,s=!Array.isArray(t[0]);if(n&&_){for(var a=0;a<e.length;a++)0<a&&(r+=m),r+=v(e[a],a);0<t.length&&(r+=y);}for(var o=0;o<t.length;o++){var h=n?e.length:t[o].length,u=!1,f=n?0===Object.keys(t[o]).length:0===t[o].length;if(i&&!n&&(u="greedy"===i?""===t[o].join("").trim():1===t[o].length&&0===t[o][0].length),"greedy"===i&&n){for(var d=[],l=0;l<h;l++){var c=s?e[l]:l;d.push(t[o][c]);}u=""===d.join("").trim();}if(!u){for(var p=0;p<h;p++){0<p&&!f&&(r+=m);var g=n&&s?e[p]:p;r+=v(t[o][g],p);}o<t.length-1&&(!i||0<h&&!f)&&(r+=y);}}return r}function v(e,t){if(null==e)return "";if(e.constructor===Date)return JSON.stringify(e).slice(1,25);!0===o&&"string"==typeof e&&null!==e.match(/^[=+\-@].*$/)&&(e="'"+e);var i=e.toString().replace(h,a),r="boolean"==typeof n&&n||"function"==typeof n&&n(e,t)||Array.isArray(n)&&n[t]||function(e,t){for(var i=0;i<t.length;i++)if(-1<e.indexOf(t[i]))return !0;return !1}(i,b.BAD_DELIMITERS)||-1<i.indexOf(m)||" "===i.charAt(0)||" "===i.charAt(i.length-1);return r?s+i+s:i}}};if(b.RECORD_SEP=String.fromCharCode(30),b.UNIT_SEP=String.fromCharCode(31),b.BYTE_ORDER_MARK="\ufeff",b.BAD_DELIMITERS=["\r","\n",'"',b.BYTE_ORDER_MARK],b.WORKERS_SUPPORTED=!n&&!!f.Worker,b.NODE_STREAM_INPUT=1,b.LocalChunkSize=10485760,b.RemoteChunkSize=5242880,b.DefaultDelimiter=",",b.Parser=E,b.ParserHandle=i,b.NetworkStreamer=l,b.FileStreamer=c,b.StringStreamer=p,b.ReadableStreamStreamer=g,f.jQuery){var d=f.jQuery;d.fn.parse=function(o){var i=o.config||{},h=[];return this.each(function(e){if(!("INPUT"===d(this).prop("tagName").toUpperCase()&&"file"===d(this).attr("type").toLowerCase()&&f.FileReader)||!this.files||0===this.files.length)return !0;for(var t=0;t<this.files.length;t++)h.push({file:this.files[t],inputElem:this,instanceConfig:d.extend({},i)});}),e(),this;function e(){if(0!==h.length){var e,t,i,r,n=h[0];if(M(o.before)){var s=o.before(n.file,n.inputElem);if("object"==typeof s){if("abort"===s.action)return e="AbortError",t=n.file,i=n.inputElem,r=s.reason,void(M(o.error)&&o.error({name:e},t,i,r));if("skip"===s.action)return void u();"object"==typeof s.config&&(n.instanceConfig=d.extend(n.instanceConfig,s.config));}else if("skip"===s)return void u()}var a=n.instanceConfig.complete;n.instanceConfig.complete=function(e){M(a)&&a(e,n.file,n.inputElem),u();},b.parse(n.file,n.instanceConfig);}else M(o.complete)&&o.complete();}function u(){h.splice(0,1),e();}};}function u(e){this._handle=null,this._finished=!1,this._completed=!1,this._halted=!1,this._input=null,this._baseIndex=0,this._partialLine="",this._rowCount=0,this._start=0,this._nextChunk=null,this.isFirstChunk=!0,this._completeResults={data:[],errors:[],meta:{}},function(e){var t=w(e);t.chunkSize=parseInt(t.chunkSize),e.step||e.chunk||(t.chunkSize=null);this._handle=new i(t),(this._handle.streamer=this)._config=t;}.call(this,e),this.parseChunk=function(e,t){if(this.isFirstChunk&&M(this._config.beforeFirstChunk)){var i=this._config.beforeFirstChunk(e);void 0!==i&&(e=i);}this.isFirstChunk=!1,this._halted=!1;var r=this._partialLine+e;this._partialLine="";var n=this._handle.parse(r,this._baseIndex,!this._finished);if(!this._handle.paused()&&!this._handle.aborted()){var s=n.meta.cursor;this._finished||(this._partialLine=r.substring(s-this._baseIndex),this._baseIndex=s),n&&n.data&&(this._rowCount+=n.data.length);var a=this._finished||this._config.preview&&this._rowCount>=this._config.preview;if(o)f.postMessage({results:n,workerId:b.WORKER_ID,finished:a});else if(M(this._config.chunk)&&!t){if(this._config.chunk(n,this._handle),this._handle.paused()||this._handle.aborted())return void(this._halted=!0);n=void 0,this._completeResults=void 0;}return this._config.step||this._config.chunk||(this._completeResults.data=this._completeResults.data.concat(n.data),this._completeResults.errors=this._completeResults.errors.concat(n.errors),this._completeResults.meta=n.meta),this._completed||!a||!M(this._config.complete)||n&&n.meta.aborted||(this._config.complete(this._completeResults,this._input),this._completed=!0),a||n&&n.meta.paused||this._nextChunk(),n}this._halted=!0;},this._sendError=function(e){M(this._config.error)?this._config.error(e):o&&this._config.error&&f.postMessage({workerId:b.WORKER_ID,error:e,finished:!1});};}function l(e){var r;(e=e||{}).chunkSize||(e.chunkSize=b.RemoteChunkSize),u.call(this,e),this._nextChunk=n?function(){this._readChunk(),this._chunkLoaded();}:function(){this._readChunk();},this.stream=function(e){this._input=e,this._nextChunk();},this._readChunk=function(){if(this._finished)this._chunkLoaded();else {if(r=new XMLHttpRequest,this._config.withCredentials&&(r.withCredentials=this._config.withCredentials),n||(r.onload=v(this._chunkLoaded,this),r.onerror=v(this._chunkError,this)),r.open(this._config.downloadRequestBody?"POST":"GET",this._input,!n),this._config.downloadRequestHeaders){var e=this._config.downloadRequestHeaders;for(var t in e)r.setRequestHeader(t,e[t]);}if(this._config.chunkSize){var i=this._start+this._config.chunkSize-1;r.setRequestHeader("Range","bytes="+this._start+"-"+i);}try{r.send(this._config.downloadRequestBody);}catch(e){this._chunkError(e.message);}n&&0===r.status&&this._chunkError();}},this._chunkLoaded=function(){4===r.readyState&&(r.status<200||400<=r.status?this._chunkError():(this._start+=this._config.chunkSize?this._config.chunkSize:r.responseText.length,this._finished=!this._config.chunkSize||this._start>=function(e){var t=e.getResponseHeader("Content-Range");if(null===t)return -1;return parseInt(t.substring(t.lastIndexOf("/")+1))}(r),this.parseChunk(r.responseText)));},this._chunkError=function(e){var t=r.statusText||e;this._sendError(new Error(t));};}function c(e){var r,n;(e=e||{}).chunkSize||(e.chunkSize=b.LocalChunkSize),u.call(this,e);var s="undefined"!=typeof FileReader;this.stream=function(e){this._input=e,n=e.slice||e.webkitSlice||e.mozSlice,s?((r=new FileReader).onload=v(this._chunkLoaded,this),r.onerror=v(this._chunkError,this)):r=new FileReaderSync,this._nextChunk();},this._nextChunk=function(){this._finished||this._config.preview&&!(this._rowCount<this._config.preview)||this._readChunk();},this._readChunk=function(){var e=this._input;if(this._config.chunkSize){var t=Math.min(this._start+this._config.chunkSize,this._input.size);e=n.call(e,this._start,t);}var i=r.readAsText(e,this._config.encoding);s||this._chunkLoaded({target:{result:i}});},this._chunkLoaded=function(e){this._start+=this._config.chunkSize,this._finished=!this._config.chunkSize||this._start>=this._input.size,this.parseChunk(e.target.result);},this._chunkError=function(){this._sendError(r.error);};}function p(e){var i;u.call(this,e=e||{}),this.stream=function(e){return i=e,this._nextChunk()},this._nextChunk=function(){if(!this._finished){var e,t=this._config.chunkSize;return t?(e=i.substring(0,t),i=i.substring(t)):(e=i,i=""),this._finished=!i,this.parseChunk(e)}};}function g(e){u.call(this,e=e||{});var t=[],i=!0,r=!1;this.pause=function(){u.prototype.pause.apply(this,arguments),this._input.pause();},this.resume=function(){u.prototype.resume.apply(this,arguments),this._input.resume();},this.stream=function(e){this._input=e,this._input.on("data",this._streamData),this._input.on("end",this._streamEnd),this._input.on("error",this._streamError);},this._checkIsFinished=function(){r&&1===t.length&&(this._finished=!0);},this._nextChunk=function(){this._checkIsFinished(),t.length?this.parseChunk(t.shift()):i=!0;},this._streamData=v(function(e){try{t.push("string"==typeof e?e:e.toString(this._config.encoding)),i&&(i=!1,this._checkIsFinished(),this.parseChunk(t.shift()));}catch(e){this._streamError(e);}},this),this._streamError=v(function(e){this._streamCleanUp(),this._sendError(e);},this),this._streamEnd=v(function(){this._streamCleanUp(),r=!0,this._streamData("");},this),this._streamCleanUp=v(function(){this._input.removeListener("data",this._streamData),this._input.removeListener("end",this._streamEnd),this._input.removeListener("error",this._streamError);},this);}function i(m){var a,o,h,r=Math.pow(2,53),n=-r,s=/^\s*-?(\d+\.?|\.\d+|\d+\.\d+)([eE][-+]?\d+)?\s*$/,u=/^(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))$/,t=this,i=0,f=0,d=!1,e=!1,l=[],c={data:[],errors:[],meta:{}};if(M(m.step)){var p=m.step;m.step=function(e){if(c=e,_())g();else {if(g(),0===c.data.length)return;i+=e.data.length,m.preview&&i>m.preview?o.abort():(c.data=c.data[0],p(c,t));}};}function y(e){return "greedy"===m.skipEmptyLines?""===e.join("").trim():1===e.length&&0===e[0].length}function g(){if(c&&h&&(k("Delimiter","UndetectableDelimiter","Unable to auto-detect delimiting character; defaulted to '"+b.DefaultDelimiter+"'"),h=!1),m.skipEmptyLines)for(var e=0;e<c.data.length;e++)y(c.data[e])&&c.data.splice(e--,1);return _()&&function(){if(!c)return;function e(e,t){M(m.transformHeader)&&(e=m.transformHeader(e,t)),l.push(e);}if(Array.isArray(c.data[0])){for(var t=0;_()&&t<c.data.length;t++)c.data[t].forEach(e);c.data.splice(0,1);}else c.data.forEach(e);}(),function(){if(!c||!m.header&&!m.dynamicTyping&&!m.transform)return c;function e(e,t){var i,r=m.header?{}:[];for(i=0;i<e.length;i++){var n=i,s=e[i];m.header&&(n=i>=l.length?"__parsed_extra":l[i]),m.transform&&(s=m.transform(s,n)),s=v(n,s),"__parsed_extra"===n?(r[n]=r[n]||[],r[n].push(s)):r[n]=s;}return m.header&&(i>l.length?k("FieldMismatch","TooManyFields","Too many fields: expected "+l.length+" fields but parsed "+i,f+t):i<l.length&&k("FieldMismatch","TooFewFields","Too few fields: expected "+l.length+" fields but parsed "+i,f+t)),r}var t=1;!c.data.length||Array.isArray(c.data[0])?(c.data=c.data.map(e),t=c.data.length):c.data=e(c.data,0);m.header&&c.meta&&(c.meta.fields=l);return f+=t,c}()}function _(){return m.header&&0===l.length}function v(e,t){return i=e,m.dynamicTypingFunction&&void 0===m.dynamicTyping[i]&&(m.dynamicTyping[i]=m.dynamicTypingFunction(i)),!0===(m.dynamicTyping[i]||m.dynamicTyping)?"true"===t||"TRUE"===t||"false"!==t&&"FALSE"!==t&&(function(e){if(s.test(e)){var t=parseFloat(e);if(n<t&&t<r)return !0}return !1}(t)?parseFloat(t):u.test(t)?new Date(t):""===t?null:t):t;var i;}function k(e,t,i,r){var n={type:e,code:t,message:i};void 0!==r&&(n.row=r),c.errors.push(n);}this.parse=function(e,t,i){var r=m.quoteChar||'"';if(m.newline||(m.newline=function(e,t){e=e.substring(0,1048576);var i=new RegExp(j(t)+"([^]*?)"+j(t),"gm"),r=(e=e.replace(i,"")).split("\r"),n=e.split("\n"),s=1<n.length&&n[0].length<r[0].length;if(1===r.length||s)return "\n";for(var a=0,o=0;o<r.length;o++)"\n"===r[o][0]&&a++;return a>=r.length/2?"\r\n":"\r"}(e,r)),h=!1,m.delimiter)M(m.delimiter)&&(m.delimiter=m.delimiter(e),c.meta.delimiter=m.delimiter);else {var n=function(e,t,i,r,n){var s,a,o,h;n=n||[",","\t","|",";",b.RECORD_SEP,b.UNIT_SEP];for(var u=0;u<n.length;u++){var f=n[u],d=0,l=0,c=0;o=void 0;for(var p=new E({comments:r,delimiter:f,newline:t,preview:10}).parse(e),g=0;g<p.data.length;g++)if(i&&y(p.data[g]))c++;else {var _=p.data[g].length;l+=_,void 0!==o?0<_&&(d+=Math.abs(_-o),o=_):o=_;}0<p.data.length&&(l/=p.data.length-c),(void 0===a||d<=a)&&(void 0===h||h<l)&&1.99<l&&(a=d,s=f,h=l);}return {successful:!!(m.delimiter=s),bestDelimiter:s}}(e,m.newline,m.skipEmptyLines,m.comments,m.delimitersToGuess);n.successful?m.delimiter=n.bestDelimiter:(h=!0,m.delimiter=b.DefaultDelimiter),c.meta.delimiter=m.delimiter;}var s=w(m);return m.preview&&m.header&&s.preview++,a=e,o=new E(s),c=o.parse(a,t,i),g(),d?{meta:{paused:!0}}:c||{meta:{paused:!1}}},this.paused=function(){return d},this.pause=function(){d=!0,o.abort(),a=M(m.chunk)?"":a.substring(o.getCharIndex());},this.resume=function(){t.streamer._halted?(d=!1,t.streamer.parseChunk(a,!0)):setTimeout(t.resume,3);},this.aborted=function(){return e},this.abort=function(){e=!0,o.abort(),c.meta.aborted=!0,M(m.complete)&&m.complete(c),a="";};}function j(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function E(e){var S,O=(e=e||{}).delimiter,x=e.newline,I=e.comments,T=e.step,D=e.preview,A=e.fastMode,L=S=void 0===e.quoteChar?'"':e.quoteChar;if(void 0!==e.escapeChar&&(L=e.escapeChar),("string"!=typeof O||-1<b.BAD_DELIMITERS.indexOf(O))&&(O=","),I===O)throw new Error("Comment character same as delimiter");!0===I?I="#":("string"!=typeof I||-1<b.BAD_DELIMITERS.indexOf(I))&&(I=!1),"\n"!==x&&"\r"!==x&&"\r\n"!==x&&(x="\n");var F=0,z=!1;this.parse=function(r,t,i){if("string"!=typeof r)throw new Error("Input must be a string");var n=r.length,e=O.length,s=x.length,a=I.length,o=M(T),h=[],u=[],f=[],d=F=0;if(!r)return C();if(A||!1!==A&&-1===r.indexOf(S)){for(var l=r.split(x),c=0;c<l.length;c++){if(f=l[c],F+=f.length,c!==l.length-1)F+=x.length;else if(i)return C();if(!I||f.substring(0,a)!==I){if(o){if(h=[],k(f.split(O)),R(),z)return C()}else k(f.split(O));if(D&&D<=c)return h=h.slice(0,D),C(!0)}}return C()}for(var p=r.indexOf(O,F),g=r.indexOf(x,F),_=new RegExp(j(L)+j(S),"g"),m=r.indexOf(S,F);;)if(r[F]!==S)if(I&&0===f.length&&r.substring(F,F+a)===I){if(-1===g)return C();F=g+s,g=r.indexOf(x,F),p=r.indexOf(O,F);}else if(-1!==p&&(p<g||-1===g))f.push(r.substring(F,p)),F=p+e,p=r.indexOf(O,F);else {if(-1===g)break;if(f.push(r.substring(F,g)),w(g+s),o&&(R(),z))return C();if(D&&h.length>=D)return C(!0)}else for(m=F,F++;;){if(-1===(m=r.indexOf(S,m+1)))return i||u.push({type:"Quotes",code:"MissingQuotes",message:"Quoted field unterminated",row:h.length,index:F}),E();if(m===n-1)return E(r.substring(F,m).replace(_,S));if(S!==L||r[m+1]!==L){if(S===L||0===m||r[m-1]!==L){-1!==p&&p<m+1&&(p=r.indexOf(O,m+1)),-1!==g&&g<m+1&&(g=r.indexOf(x,m+1));var y=b(-1===g?p:Math.min(p,g));if(r[m+1+y]===O){f.push(r.substring(F,m).replace(_,S)),r[F=m+1+y+e]!==S&&(m=r.indexOf(S,F)),p=r.indexOf(O,F),g=r.indexOf(x,F);break}var v=b(g);if(r.substring(m+1+v,m+1+v+s)===x){if(f.push(r.substring(F,m).replace(_,S)),w(m+1+v+s),p=r.indexOf(O,F),m=r.indexOf(S,F),o&&(R(),z))return C();if(D&&h.length>=D)return C(!0);break}u.push({type:"Quotes",code:"InvalidQuotes",message:"Trailing quote on quoted field is malformed",row:h.length,index:F}),m++;}}else m++;}return E();function k(e){h.push(e),d=F;}function b(e){var t=0;if(-1!==e){var i=r.substring(m+1,e);i&&""===i.trim()&&(t=i.length);}return t}function E(e){return i||(void 0===e&&(e=r.substring(F)),f.push(e),F=n,k(f),o&&R()),C()}function w(e){F=e,k(f),f=[],g=r.indexOf(x,F);}function C(e){return {data:h,errors:u,meta:{delimiter:O,linebreak:x,aborted:z,truncated:!!e,cursor:d+(t||0)}}}function R(){T(C()),h=[],u=[];}},this.abort=function(){z=!0;},this.getCharIndex=function(){return F};}function _(e){var t=e.data,i=a[t.workerId],r=!1;if(t.error)i.userError(t.error,t.file);else if(t.results&&t.results.data){var n={abort:function(){r=!0,m(t.workerId,{data:[],errors:[],meta:{aborted:!0}});},pause:y,resume:y};if(M(i.userStep)){for(var s=0;s<t.results.data.length&&(i.userStep({data:t.results.data[s],errors:t.results.errors,meta:t.results.meta},n),!r);s++);delete t.results;}else M(i.userChunk)&&(i.userChunk(t.results,n,t.file),delete t.results);}t.finished&&!r&&m(t.workerId,t.results);}function m(e,t){var i=a[e];M(i.userComplete)&&i.userComplete(t),i.terminate(),delete a[e];}function y(){throw new Error("Not implemented.")}function w(e){if("object"!=typeof e||null===e)return e;var t=Array.isArray(e)?[]:{};for(var i in e)t[i]=w(e[i]);return t}function v(e,t){return function(){e.apply(t,arguments);}}function M(e){return "function"==typeof e}return o&&(f.onmessage=function(e){var t=e.data;void 0===b.WORKER_ID&&t&&(b.WORKER_ID=t.workerId);if("string"==typeof t.input)f.postMessage({workerId:b.WORKER_ID,results:b.parse(t.input,t.config),finished:!0});else if(f.File&&t.input instanceof File||t.input instanceof Object){var i=b.parse(t.input,t.config);i&&f.postMessage({workerId:b.WORKER_ID,results:i,finished:!0});}}),(l.prototype=Object.create(u.prototype)).constructor=l,(c.prototype=Object.create(u.prototype)).constructor=c,(p.prototype=Object.create(p.prototype)).constructor=p,(g.prototype=Object.create(u.prototype)).constructor=g,b});
    });

    /* src\components\Menu.svelte generated by Svelte v3.38.3 */

    const file$1 = "src\\components\\Menu.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    // (22:2) {#if names.length === 0}
    function create_if_block$1(ctx) {
    	let div1;
    	let div0;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "Nothing to see...";
    			add_location(div0, file$1, 23, 6, 490);
    			attr_dev(div1, "class", "row svelte-ot8011");
    			add_location(div1, file$1, 22, 4, 465);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(22:2) {#if names.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (27:2) {#each names as name, i}
    function create_each_block$1(ctx) {
    	let div3;
    	let div0;
    	let t0_value = /*i*/ ctx[9] + 1 + "";
    	let t0;
    	let t1;
    	let div1;
    	let a;
    	let raw_value = /*name*/ ctx[7] + "";
    	let a_href_value;
    	let t2;
    	let div2;
    	let t4;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			a = element("a");
    			t2 = space();
    			div2 = element("div");
    			div2.textContent = "X";
    			t4 = space();
    			attr_dev(div0, "class", "num svelte-ot8011");
    			add_location(div0, file$1, 28, 6, 598);
    			attr_dev(a, "href", a_href_value = `#${/*name*/ ctx[7]}`);
    			attr_dev(a, "class", "svelte-ot8011");
    			add_location(a, file$1, 29, 24, 654);
    			attr_dev(div1, "class", "link");
    			add_location(div1, file$1, 29, 6, 636);
    			attr_dev(div2, "class", "x svelte-ot8011");
    			add_location(div2, file$1, 30, 6, 705);
    			attr_dev(div3, "class", "row svelte-ot8011");
    			add_location(div3, file$1, 27, 4, 573);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, t0);
    			append_dev(div3, t1);
    			append_dev(div3, div1);
    			append_dev(div1, a);
    			a.innerHTML = raw_value;
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div3, t4);

    			if (!mounted) {
    				dispose = listen_dev(
    					div2,
    					"click",
    					function () {
    						if (is_function(/*remove*/ ctx[1](/*i*/ ctx[9]))) /*remove*/ ctx[1](/*i*/ ctx[9]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*names*/ 1 && raw_value !== (raw_value = /*name*/ ctx[7] + "")) a.innerHTML = raw_value;
    			if (dirty & /*names*/ 1 && a_href_value !== (a_href_value = `#${/*name*/ ctx[7]}`)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(27:2) {#each names as name, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;
    	let if_block = /*names*/ ctx[0].length === 0 && create_if_block$1(ctx);
    	let each_value = /*names*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "hide svelte-ot8011");
    			toggle_class(div0, "vis", !/*shown*/ ctx[3]);
    			add_location(div0, file$1, 19, 2, 318);
    			attr_dev(div1, "class", "show svelte-ot8011");
    			toggle_class(div1, "vis", /*shown*/ ctx[3]);
    			add_location(div1, file$1, 20, 2, 377);
    			attr_dev(div2, "class", "container hidePrint svelte-ot8011");
    			add_location(div2, file$1, 18, 0, 265);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div2, t1);
    			if (if_block) if_block.m(div2, null);
    			append_dev(div2, t2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			/*div2_binding*/ ctx[6](div2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*hide*/ ctx[4], false, false, false),
    					listen_dev(div1, "click", /*show*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*shown*/ 8) {
    				toggle_class(div0, "vis", !/*shown*/ ctx[3]);
    			}

    			if (dirty & /*shown*/ 8) {
    				toggle_class(div1, "vis", /*shown*/ ctx[3]);
    			}

    			if (/*names*/ ctx[0].length === 0) {
    				if (if_block) ; else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div2, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*remove, names*/ 3) {
    				each_value = /*names*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    			/*div2_binding*/ ctx[6](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Menu", slots, []);
    	let { names = [] } = $$props;
    	let { remove } = $$props;
    	let ref;
    	let shown = true;

    	function hide() {
    		$$invalidate(2, ref.style.right = "-400px", ref);
    		$$invalidate(3, shown = false);
    	}

    	function show() {
    		$$invalidate(2, ref.style.right = "20px", ref);
    		$$invalidate(3, shown = true);
    	}

    	const writable_props = ["names", "remove"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Menu> was created with unknown prop '${key}'`);
    	});

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			ref = $$value;
    			$$invalidate(2, ref);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("names" in $$props) $$invalidate(0, names = $$props.names);
    		if ("remove" in $$props) $$invalidate(1, remove = $$props.remove);
    	};

    	$$self.$capture_state = () => ({ names, remove, ref, shown, hide, show });

    	$$self.$inject_state = $$props => {
    		if ("names" in $$props) $$invalidate(0, names = $$props.names);
    		if ("remove" in $$props) $$invalidate(1, remove = $$props.remove);
    		if ("ref" in $$props) $$invalidate(2, ref = $$props.ref);
    		if ("shown" in $$props) $$invalidate(3, shown = $$props.shown);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [names, remove, ref, shown, hide, show, div2_binding];
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { names: 0, remove: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Menu",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*remove*/ ctx[1] === undefined && !("remove" in props)) {
    			console.warn("<Menu> was created without expected prop 'remove'");
    		}
    	}

    	get names() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set names(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get remove() {
    		throw new Error("<Menu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set remove(value) {
    		throw new Error("<Menu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.38.3 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	child_ctx[22] = i;
    	return child_ctx;
    }

    // (135:0) {:else}
    function create_else_block(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*data*/ ctx[4];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*row*/ ctx[20];
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*changeName, data, selectAll, headerData*/ 624) {
    				each_value = /*data*/ ctx[4];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block, each_1_anchor, get_each_context);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(135:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (133:0) {#if data == undefined}
    function create_if_block(ctx) {
    	let divingsheet;
    	let current;

    	divingsheet = new DivingSheet({
    			props: { headerData: /*headerData*/ ctx[6] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(divingsheet.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(divingsheet, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const divingsheet_changes = {};
    			if (dirty & /*headerData*/ 64) divingsheet_changes.headerData = /*headerData*/ ctx[6];
    			divingsheet.$set(divingsheet_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(divingsheet.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(divingsheet.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(divingsheet, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(133:0) {#if data == undefined}",
    		ctx
    	});

    	return block;
    }

    // (137:4) {#if row.Age_Group !== ""}
    function create_if_block_1(ctx) {
    	let divingsheet;
    	let current;

    	function func(...args) {
    		return /*func*/ ctx[19](/*i*/ ctx[22], ...args);
    	}

    	const divingsheet_spread_levels = [
    		{ updateName: func },
    		{ print: /*selectAll*/ ctx[5] },
    		{ headerData: /*headerData*/ ctx[6] },
    		/*row*/ ctx[20]
    	];

    	let divingsheet_props = {};

    	for (let i = 0; i < divingsheet_spread_levels.length; i += 1) {
    		divingsheet_props = assign(divingsheet_props, divingsheet_spread_levels[i]);
    	}

    	divingsheet = new DivingSheet({ props: divingsheet_props, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(divingsheet.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(divingsheet, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			const divingsheet_changes = (dirty & /*changeName, data, selectAll, headerData*/ 624)
    			? get_spread_update(divingsheet_spread_levels, [
    					dirty & /*changeName, data*/ 528 && { updateName: func },
    					dirty & /*selectAll*/ 32 && { print: /*selectAll*/ ctx[5] },
    					dirty & /*headerData*/ 64 && { headerData: /*headerData*/ ctx[6] },
    					dirty & /*data*/ 16 && get_spread_object(/*row*/ ctx[20])
    				])
    			: {};

    			divingsheet.$set(divingsheet_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(divingsheet.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(divingsheet.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(divingsheet, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(137:4) {#if row.Age_Group !== \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    // (136:2) {#each data as row, i (row)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let if_block_anchor;
    	let current;
    	let if_block = /*row*/ ctx[20].Age_Group !== "" && create_if_block_1(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*row*/ ctx[20].Age_Group !== "") {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*data*/ 16) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(136:2) {#each data as row, i (row)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div8;
    	let div7;
    	let div0;
    	let span0;
    	let t1;
    	let input0;
    	let t2;
    	let div1;
    	let span1;
    	let t4;
    	let input1;
    	let t5;
    	let div2;
    	let span2;
    	let t7;
    	let input2;
    	let t8;
    	let div3;
    	let span3;
    	let t10;
    	let input3;
    	let t11;
    	let div4;
    	let span4;
    	let t13;
    	let input4;
    	let t14;
    	let div5;
    	let input5;
    	let t15;
    	let div6;
    	let input6;
    	let t16;
    	let input7;
    	let t17;
    	let menu;
    	let t18;
    	let br0;
    	let t19;
    	let hr;
    	let t20;
    	let br1;
    	let t21;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;

    	menu = new Menu({
    			props: {
    				names: /*names*/ ctx[7],
    				remove: /*remove*/ ctx[10]
    			},
    			$$inline: true
    		});

    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*data*/ ctx[4] == undefined) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div7 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "Meet:";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			div1 = element("div");
    			span1 = element("span");
    			span1.textContent = "Club:";
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			div2 = element("div");
    			span2 = element("span");
    			span2.textContent = "Location:";
    			t7 = space();
    			input2 = element("input");
    			t8 = space();
    			div3 = element("div");
    			span3 = element("span");
    			span3.textContent = "Date:";
    			t10 = space();
    			input3 = element("input");
    			t11 = space();
    			div4 = element("div");
    			span4 = element("span");
    			span4.textContent = "Data:";
    			t13 = space();
    			input4 = element("input");
    			t14 = space();
    			div5 = element("div");
    			input5 = element("input");
    			t15 = space();
    			div6 = element("div");
    			input6 = element("input");
    			t16 = space();
    			input7 = element("input");
    			t17 = space();
    			create_component(menu.$$.fragment);
    			t18 = space();
    			br0 = element("br");
    			t19 = space();
    			hr = element("hr");
    			t20 = space();
    			br1 = element("br");
    			t21 = space();
    			if_block.c();
    			if_block_anchor = empty();
    			add_location(span0, file, 79, 6, 1576);
    			attr_dev(input0, "type", "text");
    			add_location(input0, file, 80, 6, 1603);
    			attr_dev(div0, "class", "input-group svelte-1w28k3c");
    			add_location(div0, file, 78, 4, 1543);
    			add_location(span1, file, 84, 6, 1699);
    			attr_dev(input1, "type", "text");
    			add_location(input1, file, 85, 6, 1726);
    			attr_dev(div1, "class", "input-group svelte-1w28k3c");
    			add_location(div1, file, 83, 4, 1666);
    			add_location(span2, file, 89, 6, 1818);
    			attr_dev(input2, "type", "text");
    			add_location(input2, file, 90, 6, 1849);
    			attr_dev(div2, "class", "input-group svelte-1w28k3c");
    			add_location(div2, file, 88, 4, 1785);
    			add_location(span3, file, 94, 6, 1941);
    			attr_dev(input3, "type", "date");
    			add_location(input3, file, 95, 6, 1968);
    			attr_dev(div3, "class", "input-group svelte-1w28k3c");
    			add_location(div3, file, 93, 4, 1908);
    			add_location(span4, file, 99, 6, 2060);
    			attr_dev(input4, "type", "file");
    			add_location(input4, file, 100, 6, 2087);
    			attr_dev(div4, "class", "input-group svelte-1w28k3c");
    			add_location(div4, file, 98, 4, 2027);
    			attr_dev(input5, "type", "button");
    			input5.value = "Add New Sheet";
    			attr_dev(input5, "class", "svelte-1w28k3c");
    			add_location(input5, file, 104, 6, 2183);
    			attr_dev(div5, "class", "input-group svelte-1w28k3c");
    			add_location(div5, file, 103, 4, 2150);
    			attr_dev(input6, "type", "button");
    			input6.value = "Select All";
    			attr_dev(input6, "class", "svelte-1w28k3c");
    			add_location(input6, file, 112, 6, 2370);
    			attr_dev(input7, "type", "button");
    			input7.value = "Deselect All";
    			attr_dev(input7, "class", "svelte-1w28k3c");
    			add_location(input7, file, 117, 6, 2490);
    			attr_dev(div6, "class", "input-group svelte-1w28k3c");
    			add_location(div6, file, 111, 4, 2337);
    			attr_dev(div7, "class", "form-group");
    			add_location(div7, file, 77, 2, 1513);
    			add_location(br0, file, 127, 2, 2664);
    			add_location(hr, file, 128, 2, 2674);
    			add_location(br1, file, 129, 2, 2684);
    			attr_dev(div8, "id", "top");
    			attr_dev(div8, "class", "hidePrint");
    			add_location(div8, file, 76, 0, 1477);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div7);
    			append_dev(div7, div0);
    			append_dev(div0, span0);
    			append_dev(div0, t1);
    			append_dev(div0, input0);
    			set_input_value(input0, /*meetName*/ ctx[0]);
    			append_dev(div7, t2);
    			append_dev(div7, div1);
    			append_dev(div1, span1);
    			append_dev(div1, t4);
    			append_dev(div1, input1);
    			set_input_value(input1, /*club*/ ctx[1]);
    			append_dev(div7, t5);
    			append_dev(div7, div2);
    			append_dev(div2, span2);
    			append_dev(div2, t7);
    			append_dev(div2, input2);
    			set_input_value(input2, /*site*/ ctx[2]);
    			append_dev(div7, t8);
    			append_dev(div7, div3);
    			append_dev(div3, span3);
    			append_dev(div3, t10);
    			append_dev(div3, input3);
    			set_input_value(input3, /*date*/ ctx[3]);
    			append_dev(div7, t11);
    			append_dev(div7, div4);
    			append_dev(div4, span4);
    			append_dev(div4, t13);
    			append_dev(div4, input4);
    			append_dev(div7, t14);
    			append_dev(div7, div5);
    			append_dev(div5, input5);
    			append_dev(div7, t15);
    			append_dev(div7, div6);
    			append_dev(div6, input6);
    			append_dev(div6, t16);
    			append_dev(div6, input7);
    			append_dev(div8, t17);
    			mount_component(menu, div8, null);
    			append_dev(div8, t18);
    			append_dev(div8, br0);
    			append_dev(div8, t19);
    			append_dev(div8, hr);
    			append_dev(div8, t20);
    			append_dev(div8, br1);
    			insert_dev(target, t21, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[12]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[13]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[14]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[15]),
    					listen_dev(input4, "change", /*parseData*/ ctx[11], false, false, false),
    					listen_dev(input5, "click", /*click_handler*/ ctx[16], false, false, false),
    					listen_dev(input6, "click", /*click_handler_1*/ ctx[17], false, false, false),
    					listen_dev(input7, "click", /*click_handler_2*/ ctx[18], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*meetName*/ 1 && input0.value !== /*meetName*/ ctx[0]) {
    				set_input_value(input0, /*meetName*/ ctx[0]);
    			}

    			if (dirty & /*club*/ 2 && input1.value !== /*club*/ ctx[1]) {
    				set_input_value(input1, /*club*/ ctx[1]);
    			}

    			if (dirty & /*site*/ 4 && input2.value !== /*site*/ ctx[2]) {
    				set_input_value(input2, /*site*/ ctx[2]);
    			}

    			if (dirty & /*date*/ 8) {
    				set_input_value(input3, /*date*/ ctx[3]);
    			}

    			const menu_changes = {};
    			if (dirty & /*names*/ 128) menu_changes.names = /*names*/ ctx[7];
    			menu.$set(menu_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(menu.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(menu.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    			destroy_component(menu);
    			if (detaching) detach_dev(t21);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let headerData;
    	let names;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let meetName = "PlyMar vs. ";
    	let club = "Ply-Mar";
    	let site = "Ply-Mar";
    	let date = new Date();

    	let blankSheet = {
    		Age_Group: " ",
    		Dive_1: "",
    		Dive_2: "",
    		Dive_3: "",
    		Dive_4: "",
    		Dive_5: "",
    		Dive_6: "",
    		Dive_7: "",
    		Dive_8: "",
    		Gender: "un selected",
    		Name: "",
    		Official_Unofficial: ""
    	};

    	let data = [
    		{
    			Age_Group: "19-22",
    			Dive_1: "100A",
    			Dive_2: "102B",
    			Dive_3: "204B",
    			Dive_4: "5132D",
    			Dive_5: "302C",
    			Dive_6: "402C",
    			Dive_7: "402C",
    			Dive_8: "402C",
    			Gender: "male",
    			Name: "Ben Lubas",
    			Official_Unofficial: "Unofficial"
    		}
    	];

    	let changeName = (name, index) => {
    		$$invalidate(4, data[index].Name = name, data);
    	};

    	let remove = index => {
    		data.splice(index, 1);
    		$$invalidate(4, data);
    	};

    	function parseData() {
    		this.files[0];

    		papaparse_min.parse(this.files[0], {
    			header: true,
    			complete(res, file) {
    				console.log(res.data);
    				$$invalidate(4, data = res.data);
    				console.log(data);
    			}
    		});
    	}

    	let selectAll = true;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		meetName = this.value;
    		$$invalidate(0, meetName);
    	}

    	function input1_input_handler() {
    		club = this.value;
    		$$invalidate(1, club);
    	}

    	function input2_input_handler() {
    		site = this.value;
    		$$invalidate(2, site);
    	}

    	function input3_input_handler() {
    		date = this.value;
    		$$invalidate(3, date);
    	}

    	const click_handler = () => $$invalidate(4, data = [{ ...blankSheet }, ...data]);
    	const click_handler_1 = () => $$invalidate(5, selectAll = true);
    	const click_handler_2 = () => $$invalidate(5, selectAll = false);
    	const func = (i, nName) => changeName(nName, i);

    	$$self.$capture_state = () => ({
    		DivingSheet,
    		Papa: papaparse_min,
    		Menu,
    		meetName,
    		club,
    		site,
    		date,
    		blankSheet,
    		data,
    		changeName,
    		remove,
    		parseData,
    		selectAll,
    		headerData,
    		names
    	});

    	$$self.$inject_state = $$props => {
    		if ("meetName" in $$props) $$invalidate(0, meetName = $$props.meetName);
    		if ("club" in $$props) $$invalidate(1, club = $$props.club);
    		if ("site" in $$props) $$invalidate(2, site = $$props.site);
    		if ("date" in $$props) $$invalidate(3, date = $$props.date);
    		if ("blankSheet" in $$props) $$invalidate(8, blankSheet = $$props.blankSheet);
    		if ("data" in $$props) $$invalidate(4, data = $$props.data);
    		if ("changeName" in $$props) $$invalidate(9, changeName = $$props.changeName);
    		if ("remove" in $$props) $$invalidate(10, remove = $$props.remove);
    		if ("selectAll" in $$props) $$invalidate(5, selectAll = $$props.selectAll);
    		if ("headerData" in $$props) $$invalidate(6, headerData = $$props.headerData);
    		if ("names" in $$props) $$invalidate(7, names = $$props.names);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*meetName, club, site, date*/ 15) {
    			$$invalidate(6, headerData = { meetName, club, site, date });
    		}

    		if ($$self.$$.dirty & /*data*/ 16) {
    			$$invalidate(7, names = data.map(val => val.Name).filter(val => val !== undefined));
    		}
    	};

    	return [
    		meetName,
    		club,
    		site,
    		date,
    		data,
    		selectAll,
    		headerData,
    		names,
    		blankSheet,
    		changeName,
    		remove,
    		parseData,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		func
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
