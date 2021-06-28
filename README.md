# Diving sheets are annoying...

So I made this. It lets you keep your divers names in a spreadsheet with their dives and then
easily convert them to printable diving sheets to use at a meet. If somehow, anyone who isn't
the Ply-Mar coach comes across this and wants to use it, go ahead. I couldn't stop you even if
I wanted to. Would be cool if you let me know though, maybe leave a comment here. 

## Instructions

- Use Chrome or a Chromium based browser, like Brave or Edge (if you don't know what this means, use Chrome, not Firefox)
- Either download the public folder and open index.html in your browser, or go to
  [this page](https://benlubas.github.io/diveSheets/index.html)
- Download the diverData.csv file and enter the divers' info and dives. Be sure to keep the same format (ie. don't change the header names or move anything around)
- Upload the csv file to the website and fill out the fields up top.
- Select the sheets you want to print, hit control + p (or cmnd + p on mac)
- IMPORTANT: in the print settings of chrome, hit more settings:
  - Turn off "Headers and footers"
  - Turn on "Background graphics"
- From here you can either save the sheets as a PDF or directly print them out

## Troubleshooting

### Something broke and nothing is showing up? It was almost certainly the csv file that you uploaded

1. Make sure the file is a .csv, not a .xlsx or anything else.
2. Check the header names against the diverData.csv file in here, if they're different redownload
   the file and copy the headers over, or, better yet, copy the information into the newly downloaded
   file.

### DD shows as undefined

1. This happens when you enter a dive that my program doesn't know the DD for. This
   either means that the dive is not legal, or absolutely insane and you have an olympian on
   your hands.
2. You can fix this by forking the code and adding the dive to dd.js
3. If you don't know how to do this and you really need that dive just leave the column blank
   in the csv file and then print and handwrite it in.

### Nothing in the print preview

1. Did you click "Deselect all"? Because that deselects all the "print this one" check boxes,
   which, believe it or not, work as intended.

### The date is tomorrow

1. I assume you're prepared, but not super prepared, so the date defaults to tomorrow.
   I don't know if you've looked at the program yet, but there is a date picker at the top.
   It works.
