# stick_drift

![First stick figure - Aug 11th 2026](screenshots/first_stick_figure_aug_11th_2026)

Excalibur + TypeScript 2D game. This README takes you from a first clone to a running local build.

## Requirements

- Git
- Node.js **24.19.0** (pinned in `.nvmrc`)
- npm (comes with Node)

Check what you already have:

```bash
git --version
node -v
npm -v
```

`node -v` should print `v24.19.0`. If Node is missing, or you have an older distro version (for example Ubuntu/Mint apt Node 18), install nvm and then the pinned version. `nvm` is **not** an apt package — `sudo apt install nvm` will not work.

### Install nvm (Linux / macOS)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc    # or: source ~/.zshrc
```

If `curl` is missing on Debian/Ubuntu/Mint:

```bash
sudo apt update
sudo apt install -y curl
```

Confirm nvm loaded:

```bash
command -v nvm
nvm --version
```

If it still says `command not found`, either open a new terminal or load it by hand:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
```

### Install the repo's Node version

From the project root (after cloning), nvm reads `.nvmrc`:

```bash
nvm install
nvm use
node -v    # v24.19.0
```

Or explicitly:

```bash
nvm install 24.19.0
nvm use 24.19.0
```

Optional, so new terminals default to 24:

```bash
nvm alias default 24.19.0
```

`which node` should point under `~/.nvm/versions/node/v24.19.0/`, not `/usr/bin/node`.

## Clone

```bash
git clone https://github.com/RoundBearChoi/stick_drift.git
cd stick_drift
```

SSH, if you already have keys set up:

```bash
git clone git@github.com:RoundBearChoi/stick_drift.git
cd stick_drift
```

You should see `package.json`, `webpack.config.js`, `src/`, `res/`, and `index.html` in the current directory.

Then select the pinned Node version:

```bash
nvm use
```

## Install dependencies

Use npm (the repo ships a `package-lock.json`):

```bash
npm install
```

Lockfile-exact alternative:

```bash
npm ci
```

Do not use `sudo npm install`. Stay in the repo root; `node_modules/` is gitignored and created locally.

## Start

```bash
npm start
```

That is an alias for `npm run dev`, which runs:

```text
webpack-dev-server --mode development --open
```

Webpack compiles `src/main.ts`, serves the game on **port 9000**, and tries to open your default browser.

Open this if a tab does not appear:

```text
http://localhost:9000
```

Leave the terminal running. Stop the server with Ctrl+C.

### Other scripts

| Command | What it does |
| --- | --- |
| `npm start` / `npm run dev` | Dev server at http://localhost:9000 |
| `npm run build` | Production bundle into `dist/` |

`dist/` is written during `npm start` as well (`devServer.devMiddleware.writeToDisk` is on). It is gitignored. Do not commit it.

## What success looks like

- Terminal shows a successful webpack compile
- Browser loads a black full-window page with a centered Excalibur canvas
- Edits under `src/` trigger a rebuild

## Troubleshooting

**`nvm: command not found`**  
nvm is not installed, or the current shell has not sourced `~/.bashrc` / `~/.zshrc`. Follow the nvm section above. Do not `sudo apt install nvm`.

**`node -v` is still v18.x after installing 24**  
nvm is not active in that terminal, so you are still on the system Node (`/usr/bin/node`). Run `source ~/.bashrc`, then `nvm use 24.19.0`, and check `which node`.

**`npm start` fails with engine / webpack-dev-server errors**  
You are probably on Node 18 from apt. This project expects 24.19.0.

**`EADDRINUSE :::9000`**  
Something else is bound to port 9000.

```bash
# macOS / Linux
lsof -i :9000
kill <PID>
```

**Wrong directory**  
`npm start` only works in the folder that contains `package.json`.

**Blank canvas, page loads**  
Open the browser console. Typical causes are a runtime throw during scene setup or a missing file under `/res/`.

## Stack

- [Excalibur](https://excaliburjs.com/) `0.32.0`
- TypeScript `5.9.3`
- Webpack 5 + webpack-dev-server (port 9000)
- Aseprite plugin: `@excaliburjs/plugin-aseprite`
