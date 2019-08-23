# html-parser
A simple html parser in Node. It processes inline CSS and it accepts a couple of html elements: `span, p, h1, h2, h3, span, table, td, th`


## Supported css styles:

color:

    black
    red
    green
    yellow
    blue
    magenta
    cyan
    white
    gray
    grey

    rainbow         //extra
    zebra           //extra
    america         //extra
    trap            //extra
    random          //extra

    invert          //extra


background:

    black
    red
    green
    yellow
    blue
    magenta
    cyan
    white

font-weight:

    bold

font-style

    italic

text-decoration:

    underline
    line-through

visibility:

    visible
    hidden

## Installation

`npm install`

## Run
`node main.js test1.html`
or
`npm run start`

## Warning

Some of these CLI options are not supported by some IDEs (like Webstorm)

Please run the terminal in high resolution like having a minimum width of 800 pixels

## About the implementation

1. I could have used JQuery (Cheerio), but I decided it would have been cheating that way as CSS and HTML is being processed by the library automatically. So instead, I used regex expressions to find and identify html tags and attributes manually and processing them manually afterwords
2. Node.js console.log totally sucks. It doesn't support `%c` to print colors
   Running this `console.log('%c Oh my heavens! ', 'background: #222; color: #bada55');` will not have any result in node.js terminal, only in Browser's debugging console
3. Initially, I used node-terms package, a package but, I decided to implement my own library for a few more features. Unfortunately, font-size is not supported in Terminal/Node.js
4. Node.js & Browsers supports console.table, but I decided it would have been cheating that way as tables are being processed automatically. So, instead I decided to write my own table printer function.

## Demo


`node main.js test1.html`
![](images/demo.png?raw=true)