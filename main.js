console.log("starting");
const fs = require('fs');

async function processFile(path){

    path = `files/${path}`;

    try {
        if (!fs.existsSync(path))
            throw "file not found"

        const content = await fs.readFileSync( path ).toString();
        console.log(content);

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

            tags.push({
                tag,
                tagName: tagName ? tagName[1] : '',
                pos: found.index,
                attributes,
            });
            regex.lastIndex = found.index+1;

            if (tag[0] === '<' && tag[1] === '/'){
                if (stack[stack.length-1] !== tagName) throw "invalid closing tags";
                stack.splice( stack.length-1, 1);
            }else
            if (tag[0]==='<' && tag[1]!=='/' && tag.indexOf("/>") !== tag.length-2)
                stack.push(tagName);



        }

        console.log(tags);

    } catch(err) {
        console.error(err);
        return;
    }

}


processFile(process.argv[2]);