console.log("starting");
const fs = require('fs');

async function processFile(path){

    path = `files/${path}`;

    try {
        if (!fs.existsSync(path))
            throw "file not found"
    } catch(err) {
        console.error(err);
        return;
    }

    const content = await fs.readFileSync( path ).toString();

    console.log(content);

}


processFile(process.argv[2]);