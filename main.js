const fs = require('fs');
const colors = require('colors/safe');

let finalStylesNestedMap = {};

function getAbsolutePath(path){
    return `files/${path}`;
}

function parseCSSProperties(text){

    const styles = {};

    const regexInlineCSS = /([\w-]+)\s*:\s*([^;]+)\s*;?/g;

    let matchStyle;

    while (matchStyle = regexInlineCSS.exec(text) )
        styles[matchStyle[1]] = matchStyle[2];

    return styles;

}

async function processFile(path){

    path = getAbsolutePath(path);

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
            let styles = {}, classes = [], tagId;

            let match;
            while (match = regexAttributes.exec(tag) )
                attributes[match[1]] = match[3];

            let tagName = regexId.exec(tag);
            if (tagName ) tagName = tagName[1];
            else tagName = undefined;

            if (attributes.class)
                classes = attributes.class.split(/(\s+)/);


            if (attributes.style){

                const out = parseCSSProperties( attributes.style );
                styles = {
                    ...styles,
                    ...out
                };

            }

            if (attributes.id)
                tagId = attributes.id;

            const element = {
                tag,
                tagId,
                tagName,
                start: content.indexOf(tag, found.index) + tag.length ,
                attributes,
                styles,
                classes,
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
            if (tag[0]==='<' && tag[1]!=='/' ) {

                if (stack.length)
                    stack[stack.length-1].children.push( element );

                if (tag.indexOf("/>") !== tag.length-2)
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
};

function getTextStyle(text, style){

    const available = {

        color: {
            available: ['black','red','green','yellow','blue','magenta','cyan','white','gray','grey', 'rainbow', 'zebra','america','trap', 'random', 'inverse'],
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

async function getFile(path){

    path = getAbsolutePath(path);

    try {

        if ( fs.existsSync(path) ) {

            const content = await fs.readFileSync( path ).toString();
            return content || '';

        } else throw "File not found";

    } catch(err) {
        console.error("File not found", path);
    }

    return '';

}

async function processHead(tags){

    if (!Array.isArray(tags)) tags = [tags];

    let css = [];

    for (let i=0; i < tags.length; i ++) {

        const tag = tags[i];
        if (!tag || tag.isEnd) continue;

        if ( ["link"].indexOf(tag.tagName) >= 0) {

            if (tag.attributes.rel !== "stylesheet"){
                console.error("link tag rel is invalid");
                continue;
            }

            if ( !tag.attributes.href ){
                console.error("link ref is not found!");
                continue;
            }

            css.push( getFile( tag.attributes.href ) );

        }

        if ( ["style"].indexOf(tag.tagName) >= 0 ) {

            css.push ( tag.innerHTML );

        }

    }

    css = await Promise.all( css );

    return css;

}

function findCharactersInString(string, separators ){

    for (let char of separators){
        const pos = string.indexOf(char );
        if ( pos >= 0)
            return  {
                pos,
                char,
            }
    }

}

function processCSS(css ){

    const finalStylesNestedMap = {};

    const CSSregex = /([^{]+)\s*\{\s*([^}]*?)}/g;

    let found;
    while ( (found = CSSregex.exec(css)) !== null ){

        let cssName = found[1].trim();
        const cssProperties = found[2].trim();

        const styles = parseCSSProperties(cssProperties);

        let cssNameClone = cssName;

        let position = {pos: 0}, s2;
        const selectors = [];
        while ( ( position = findCharactersInString( cssNameClone, ['>',':nth-child'] ) ) !== undefined ){

            const s1 = cssNameClone.substr(0, position.pos -1 ).trim();
            const symbol = position.char;
            s2 = cssNameClone.substr(position.pos + position.char.length , ).trim();

            cssNameClone = cssNameClone.substr( position.pos + position.char.length , );

            //console.log(s1, symbol, s2);
            selectors.push( {
                s1, symbol,
            });
        }

        if (s2)
            selectors.push({
                s1: s2,
            });


        if (selectors.length){

            let compiledCSSName = '';

            let parent = finalStylesNestedMap;
            for (let i=0; i < selectors.length; i++) {

                const it = selectors[i];

                compiledCSSName = compiledCSSName + it.s1 + (it.symbol || '');

                if (it.symbol === '>' ) {

                    if (!parent[it.s1]) parent[it.s1] = {};


                    parent = parent[it.s1];
                } else if (!it.symbol) {

                    parent[it.s1] = {
                        ...(parent[it.s1]||{}),
                        ...styles,
                    };

                }
            }

            cssName = compiledCSSName;

        } else  finalStylesNestedMap[cssName] = {
            ...( finalStylesNestedMap[cssName]||{} ),
            ...styles
        };


    }

    return finalStylesNestedMap;

}

async function processDOM(tags, parent, stylesParent={}, index  = 0, finalStyles = {} ){

    const styles = [ ];

    if (!Array.isArray(tags)) tags = [tags];

    for (let i=0; i < tags.length; i++){

        const tag = tags[i];
        if (!tag || tag.isEnd) continue;

        tag.styles = {
            ...(finalStyles[tag.tagName]||{}),
            ...(finalStyles['#'+ tag.tagId ]||{}),
            ...tag.styles,
            ...stylesParent,
        };

        for (const className of tag.classes)
            if (finalStyles[ '.' + className ])
                tag.styles = {
                    ...tag.styles,
                    ...finalStyles['.' +className],
                };

        if ( ["h1","h2","h3"].indexOf(tag.tagName) >= 0) {
            tag.styles["font-weight"] = "bold;";
            tag.styles["text-decoration"] = "underline;";
        }

        if ( ["p", "h1", "h2", "h3", 'h4', 'span','div'].indexOf( tag.tagName ) >= 0 )
            console.log( getTextStyle( tag.innerHTML, tag.styles ) );


        if (tag.tagName === "tr"){

            const sum =  parent._tableWidths.reduce((sum, value) => sum + 1 + value, 0);

            console.log(`+${Array( Math.floor( sum )).join('-')}+`);
            const titles = [];
            for (const child of tag.children)
                titles.push(child);

            let s = '| ';
            for (let i=0; i < titles.length; i++) {

                const width = parent._tableWidths[i] ;

                const len = titles[i].innerHTML.length;
                s += getTextStyle( Array( Math.max( 0, Math.round((width-len)/2 ))).join(' ') + (titles[i].innerHTML.length >= width-2 ? titles[i].innerHTML.substr(0, width-5) +'...' : titles[i].innerHTML )+ Array( Math.max( 0, Math.floor((width-len)/2 ))).join(' '), {...titles[i].styles, ...tag.styles,}) + ' | ';
            }

            console.log(s);

            if (index === parent.children.length -1)
                console.log(`+${Array( Math.floor( sum )).join('-')}+`);

        }

        if (tag.tagName === "br")
            console.log("\n\n");

        const nestedStyles = {
            ...finalStylesNestedMap,
            ...finalStyles,
            ...(finalStyles[tag.tagName]||{}),
            ...(finalStyles['#'+ tag.tagId ]||{}),
        };

        if (tag.tagName === "table"){

            const widths = [];

            for (const child of tag.children){

                for (let i=0;  i< child.children.length; i++) {
                    const subchild = child.children[i];
                    if (!widths[i]) widths[i] = 20;

                    widths[i] = Math.max(widths[i], Math.floor( Number.parseFloat((subchild.styles['width'] || '0px').replace('px', '')) / 3 ));
                }

            }

            tag._tableWidths = widths;

            const columnsStyles = ( await processDOM(tag.children[0], tag, stylesParent, 0, nestedStyles ) ) [0];

            for (let i=1; i < tag.children.length; i++)
                await processDOM(tag.children[i], tag, { ...tag.styles }, i, nestedStyles )


        } else
            styles.push( await processDOM(tag.children, tag, tag.styles, 0, nestedStyles ) );


    }



    if (tags.length === 0) return stylesParent;
    else return styles;

}

function findChild(tags, tagName){

    if (!Array.isArray(tags)) tags = [tags];

    for (const tag of tags){

        if (tag.tagName === tagName) return tag;

        if (tag.children) {
            const out = findChild(tag.children, tagName);
            if (out) return out;
        }


    }

}

async function processPage(filename){

    const tags = await processFile(filename);

    const head = findChild(tags, 'head');
    const body = findChild(tags, 'body');

    let css = await Promise.all( [
        processHead( head ? head.children : [] ),
        processHead( body ? body.children : [] ),
    ] );

    css = css[0].concat(css[1]);
    css = css.join(' ');

    finalStylesNestedMap = processCSS(css);

    return processDOM(tags, undefined, {}, 0, finalStylesNestedMap );

}

processPage( process.argv[2] );
