# stick_drift

![First stick figure - Aug 11th 2026](screenshots/first_stick_figure_aug_11th_2026)

### Install nvm (Linux / macOS)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc    # or: source ~/.zshrc
```

## Clone

```bash
git clone https://github.com/RoundBearChoi/stick_drift.git
cd stick_drift
```

### Install the repo's Node version

```bash
nvm install
nvm use
node -v    # v24.19.0
```

select the pinned Node version:

```bash
nvm use
```

## Install dependencies

```bash
npm install
```

## Start

```bash
npm start
```

## Stack

- [Excalibur](https://excaliburjs.com/) `0.32.0`
- TypeScript `5.9.3`
- Webpack 5 + webpack-dev-server (port 9000)
- Aseprite plugin: `@excaliburjs/plugin-aseprite`
