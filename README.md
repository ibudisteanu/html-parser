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

The implementation is more "hard core" using Regex to parse the HTML page manually extracting the DOM elements with their attributes.

A much simpler implementation would have been done by using some 3rd party libraries:

1. `JQuery(Cheerio)` - in order to parse automatically the DOM and extract the computed styles of the elements from html pages.
2. `console.table` is a built-in function which renders tables automatically.
3. `node-terms` package to render styled texts in terminal.

I decided not to use any of these libraries because I would have been "cheating", destroying the entire purpose of the project.

Observations

1. Node.js console.log doesn't support `%c` to print styled texts in the terminal output. It works only in the Browser's debugging console. So, `%c` is not supported in any Node.js version so far.

   Running this `console.log('%c Oh my heavens! ', 'background: #222; color: #bada55');` will not have any result in node.js terminal

## Demo


```node main.js test1.html```

![](images/demo.png?raw=true)