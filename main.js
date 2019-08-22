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

        const regex = /<("[^"]*"|'[^']*'|[^'">])*>/g;
        const regexAttirubtes = new RegExp('[\\s\\r\\t\\n]*([a-z0-9\\-_]+)[\\s\\r\\t\\n]*=[\\s\\r\\t\\n]*([\'"])((?:\\\\\\2|(?!\\2).)*)\\2', 'ig');

        let found, tags = [], stack = [];

        while (found = regex.exec(content)){

            const tag = found[0].trim(), attributes = {};

            let match;
            while (match = regexAttirubtes.exec(tag) )
                attributes[match[1]] = match[3];

            tags.push({
                tag,
                pos: found.index,
                attributes,
            });
            regex.lastIndex = found.index+1;

            if (tag[0]==='<' && tag[1]!=='/')
                stack.push(tag);

        }

        console.log(tags);

    } catch(err) {
        console.error(err);
        return;
    }

}


processFile(process.argv[2]);