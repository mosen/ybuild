// build via chain

files(['a.js', 'b.js', 'c.js']).concat().fork(
    write(outDir component-debug.js),
    replace(regex).write(outDir component.js),
    minify(options).write(outDir component-min.js)
);

files(['a.css', 'b.css']).concat().minify()

