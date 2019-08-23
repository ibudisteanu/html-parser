console.log("starting");
const fs = require('fs');
const termCss = require('term-css')

/**
 *
 * Term-CSS only supports
 *
 * text-decoration: <underline|inverse>
   font-weight: <bold>
   font-style: <italic>
   color: <grey|gray|black|blue|cyan|green|red|magenta|yellow>
   background: <grey|gray|black|blue|cyan|green|red|magenta|yellow>
 *
 * @param path
 * @returns {Promise<void>}
 */

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

function convertStyleToCSS(styles){

    let css = 'element { ';
    for (const style in styles) {
        css += `${style}:${styles[style]}`;
        if (css[css.length-1] !== ';') css += ';';
    }
    css += "}";

    return css;
}

async function processDOM(tags, stylesParent={}){

    if (!Array.isArray(tags)) tags = [tags];

    const styles = [];
    for (const tag of tags){

        if (tag.isEnd) continue;

        for (const key in stylesParent)
            if (!tag.styles[key])
                tag.styles[key] = stylesParent[key];

        if ( ["h1","h2","h3"].indexOf(tag.tagName) >= 0)
            tag.styles["font-weight"] = "bold;";

        if ( ["p", "h1", "h2", "h3"].indexOf( tag.tagName ) >= 0 ) {

            const cssCompiled = termCss.compile('  {element} ', convertStyleToCSS(tag.styles) );
            console.log(cssCompiled( {element: tag.innerHTML} ));

        }

        if (tag.tagName === "tr"){

            console.log("+---------------------------------------+");
            const titles = [];
            for (const child of tag.children)
                titles.push(child.innerHTML);

            let s = '| ';
            for (let i=0; i < titles.length; i++)
                s += titles[i] + ' | ';

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

    await processDOM(tags, {} );

}
processPage(process.argv[2] );