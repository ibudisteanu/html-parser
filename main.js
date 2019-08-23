console.log("starting");
const fs = require('fs');
const colors = require('colors/safe');

async function processFile(path){

    path = `files/${path}`;

    try {
        if (!fs.existsSync(path))
            throw "file not found"

        const content = await fs.readFileSync( path ).toString();

        if (!content) throw "no content";

        let found, tags = [], stack = [];
        const regex = /<("[^"]*"|'[^']*'|[^'">])*>/g;

        while (found = regex.exec(content)){

            const regexAttributes = new RegExp('[\\s\\r\\t\\n]*([a-z0-9\\-_]+)[\\s\\r\\t\\n]*=[\\s\\r\\t\\n]*([\'"])((?:\\\\\\2|(?!\\2).)*)\\2', 'ig');
            const regexId = /<\/?(\w+)(\s+\w+.*?)?\/?>/g;

            const tag = found[0].trim(), attributes = {}, styles = {};

            let match;
            while (match = regexAttributes.exec(tag) )
                attributes[match[1]] = match[3];

            let tagName = regexId.exec(tag);
            if (tagName ) tagName = tagName[1];
            else tagName = undefined;

            if (attributes.style){

                const regexInlineCSS = /([\w-]+)\s*:\s*([^;]+)\s*;?/g;

                let matchStyle;
                while (matchStyle = regexInlineCSS.exec(attributes.style) )
                    styles[matchStyle[1]] = matchStyle[2];

            }

            const element = {
                tag,
                tagName,
                start: content.indexOf(tag, found.index) + tag.length ,
                attributes,
                styles,
                children: [],
            };
            regex.lastIndex = found.index+1;

            if (stack.length === 0)
                tags.push(element);


            if (tag[0] === '<' && tag[1] === '/'){
                if (stack[stack.length-1].tagName !== tagName) throw "invalid closing tags";
                stack[stack.length-1].end = found.index;

                const innerHTML = content.substr( stack[stack.length-1].start, found.index - stack[stack.length-1].start );
                stack[stack.length-1].innerHTML = innerHTML;

                stack.splice( stack.length-1, 1);
                element.isEnd = true;

            }else
            if (tag[0]==='<' && tag[1]!=='/' && tag.indexOf("/>") !== tag.length-2) {

                if (stack.length)
                    stack[stack.length-1].children.push( element );

                stack.push(element);

            }

        }

        return tags;

    } catch(err) {
        console.error(err);
    }

}

const capitalize = (s) => {
    if (typeof s !== 'string') return '';
    return s.charAt(0).toUpperCase() + s.slice(1)
}

function getTextStyle(text, style){

    const available = {

        color: {
            available: ['black','red','green','yellow','blue','magenta','cyan','white','gray','grey', 'rainbow', 'zebra','america',' trap', 'random', 'inverse'],
        },

        background: {
            available: ['black','red','green','yellow','blue','magenta','cyan','white'],
            callback: value => 'bg'+capitalize(value),
        },

        "font-weight":{
            available: ['bold'],
        },

        "font-style":{
            available: ['italic'],
        },

        "text-decoration":{
            available: ['underline', 'line-through'],
            callback: value => value === 'line-through' ?  'strikethrough' : value,
        },

        visibility: {
            available: ['visible', 'hidden'],
            callback: value => value === 'visible' ? '' : value,
        },

    };

    for (const key in available)
        if (style[key] ){

            let value = style[key];

            if (value[value.length-1] === ';') value = value.substr(0, value.length-1);

            if ( available[key].available.indexOf(value) < 0 ) {
                console.warn(`Invalid value ${value} for ${key}`);
                continue;
            }

            const callback = available[key].callback || (a => a);
            const property = callback( value);

            if (property)
                if (!colors[property]) console.warn(`Invalid value ${property} for ${key}`);
                else  text = colors[ property ](text);


        }

    return text;

}

async function processDOM(tags, stylesParent={}){

    if (!Array.isArray(tags)) tags = [tags];

    const styles = [];
    for (const tag of tags){

        if (tag.isEnd) continue;

        for (const key in stylesParent)
            if (!tag.styles[key])
                tag.styles[key] = stylesParent[key];

        if ( ["h1","h2","h3"].indexOf(tag.tagName) >= 0) {
            tag.styles["font-weight"] = "bold;";
            tag.styles["text-decoration"] = "underline;";
        }

        if ( ["p", "h1", "h2", "h3", 'h4', 'span'].indexOf( tag.tagName ) >= 0 ) {

            console.log(getTextStyle( tag.innerHTML, tag.styles ));

        }

        if (tag.tagName === "tr"){

            console.log("+---------------------------------------+");
            const titles = [];
            for (const child of tag.children)
                titles.push(child);


            let s = '| ';
            for (let i=0; i < titles.length; i++)
                s += getTextStyle( titles[i].innerHTML, titles[i].styles)  + ' | ';

            console.log(s);

            console.log("+---------------------------------------+");

        }

        if (tag.tagName === "br")
            console.log("\n\n");

        if (tag.tagName === "table"){

            const columnsStyles = ( await processDOM(tag.children[0], { } ) ) [0];

            for (let i=1; i < tag.children.length; i++)
                await processDOM(tag.children[i], columnsStyles[i])


        } else
            styles.push( await processDOM(tag.children, tag.styles) );


    }

    if (tags.length === 0) return stylesParent;
    else return styles;

}

async function processPage(filename){

    const tags = await processFile(filename);

    return processDOM(tags, {} );

}
processPage(process.argv[2] );