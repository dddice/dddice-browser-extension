# dddice Browser Extension

Roll 3D dice from your favorite VTT! Integrates [dddice](https://dddice.com) with browser-based virtual tabletops,
providing you with a seamless dice rolling experience. Use dddice to overlay dice on your stream, or simply share the fun
of dice rolling in a private room.

Supports:

* D&D Beyond
* Roll20
* Dungeon Master's Vault


## Installation

Install this extension for [Chrome](https://chrome.google.com/webstore/detail/dddice/npmficphbhbhebhjfekjopgkpojjcfem)

## Development

If you would like to contribute to this extension (i.e. add support for your favorite VTT), follow the instructions
below.

You will need [Node.js](https://nodejs.org/en/) and [NPM](https://www.npmjs.com/).

``` shell
# Clone this repository
git clone git@github.com:dddice/dddice-browser-extension.git

# Install dependencies
npm i

# Start the browser extension
npm run start
```

In Chrome, navigate to `chrome://extensions/` and toggle **Developer Mode** in the upper-right corner.

Click **Load unpacked** and locate the `dist/` directory that was built in this repository.

In order to enable debugging messages, which show in the console, you must set the `localStorage` key `debug` to `*`. This
can be done by entering the following code in the browser's console:

```javascript
localStorage.setItem('debug', '*');
```

If you plan on contributing your changes upstream (always appreciated!), then do the following:

* To conform to our code style, either run `npx husky install` to install our git hooks, or run
  `npx prettier src --write && npx eslint src --fix` before comitting.
* Rebase/squash your commits to submit one clean commit.
* Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) prefixes in your commit message. See
  examples in our `git log`. This helps our automation update the changelog. Here's a few examples:
  * `feat:` for new features.
  * `fix:` for general fixes.
  * `fix(d&db):`, `fix(roll20):`, `fix(dmv):` or `fix(pb2e)' for D&D Beyond, Roll20, Dungeon Master's Vault or Pathbuilder 2e fixes,
     respectively.

If you have any questions at all, please join our [Discord server](https://discord.gg/VzHq5TfAr6). We'll be happy to help
in any way we can.

## License

MIT
