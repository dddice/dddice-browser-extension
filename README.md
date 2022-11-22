# dddice Browser Extension

Roll 3D dice from your favorite VTT! Integrates [dddice](https://dddice.com) with browser-based virtual tabletops,
providing you with a seamless dice rolling experience. Use dddice to overlay dice on your stream or simply share the fun
of dice rolling in a private room.

Supports:

* [D&DBeyond](https://chrome.google.com/webstore/detail/dddice/npmficphbhbhebhjfekjopgkpojjcfem)
* [Roll20](https://chrome.google.com/webstore/detail/dddice/npmficphbhbhebhjfekjopgkpojjcfem)

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

## License

MIT
