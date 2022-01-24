# node-easyfetch
A forked project of node-superfetch, (node-superfetch: Brings superagent type styling inside node-fetch)

# Info
node-superfetch is perfect, but an issue is that it's not getting updated as node-fetch now brings a new feature ESM module on their node-fetch@v3+, since node-superfetch doesn't getting updated it's still node support v3 node-fetch, an issue for update I've already created [see here](https://github.com/dragonfire535/node-superfetch/issues/121). And there's no reply, so I've migrate it to ESM support.

# Example
```js
import Request from "node-easyfetch";

(async () => {
    try {
        const { body } = await Request.get("https://registry.npmjs.com/node-fetch");
        console.log(body);
    } catch (err) {
        console.error(err);
    }
    return null;
})();
```

# License
Same license as node-superfetch [ISC](https://github.com/wory48/node-easyfetch/blob/main/LICENSE)
