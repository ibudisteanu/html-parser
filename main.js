console.log("starting");
const fs = require('fs');

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

            const tag = found[0].trim(), attributes = {};

            let match;
            while (match = regexAttributes.exec(tag) )
                attributes[match[1]] = match[3];

            let tagName = regexId.exec(tag);
            if (tagName ) tagName = tagName[1];
            else tagName = undefined;

            const element = {
                tag,
                tagName,
                start: content.indexOf(tag, found.index) + tag.length ,
                attributes,
            };
            tags.push(element);
            regex.lastIndex = found.index+1;

            if (attributes.style){

                const regexInlineCSS = /([\w-]+)\s*:\s*([^;]+)\s*;?/g;
                const styles = {};

                let matchStyle;
                while (matchStyle = regexInlineCSS.exec(attributes.style) )
                    styles[matchStyle[1]] = matchStyle[2];

                element.styles = styles;

            }

            if (tag[0] === '<' && tag[1] === '/'){
                if (stack[stack.length-1].tagName !== tagName) throw "invalid closing tags";
                stack[stack.length-1].end = found.index;

                const innerHTML = content.substr( stack[stack.length-1].start, found.index - stack[stack.length-1].start );
                stack[stack.length-1].innerHTML = innerHTML;

                stack.splice( stack.length-1, 1);
                element.isEnd = true;

            }else
            if (tag[0]==='<' && tag[1]!=='/' && tag.indexOf("/>") !== tag.length-2) {
                stack.push(element);
            }

        }

        for (const tag of tags){

            if (tag.isEnd) continue;

            if ( ["p", "h1", "h2", "h3"].indexOf( tag.tagName ) >= 0 ) {
                console.log(tag.innerHTML);
            }

            if (tag.tagName === "br")
                console.log("\n\n");


        }

    } catch(err) {
        console.error(err);
    }

}


processFile(process.argv[2]);