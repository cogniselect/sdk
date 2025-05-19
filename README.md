# CogniSelect SDK

Browser SDK for CogniSelect – context-menu AI features.

## Installation

### npm

Install via npm:

```bash
npm install @cogniselect/sdk
```

### CDN

#### ES Modules

Load as an ES module:

```html
<script type="module">
  import { CogniSelect } from 'https://cdn.jsdelivr.net/npm/@cogniselect/sdk/dist/index.esm.js';
  // or unpkg:
  // import { CogniSelect } from 'https://unpkg.com/@cogniselect/sdk/dist/index.esm.js';
</script>
```

#### UMD Build

```html
<script src="https://cdn.jsdelivr.net/npm/@cogniselect/sdk/dist/index.umd.js"></script>
<script>
  const { CogniSelect } = window;
</script>
```

## Usage

Import and initialize CogniSelect:

```javascript
import { CogniSelect, prebuiltModelIds } from '@cogniselect/sdk';

const cogniselect = new CogniSelect({
  model: prebuiltModelIds[0], // or 'gemma-2-2b-it-q4f16_1-MLC',
  cacheStrategy: 'persistent', // Cache model in browser storage
  actions: [
    {
      category: 'summarize',
      description: 'Summarize the selected text',
      prompt: 'Summarize the selected text: "{text}"',
    },
    {
      category: 'quiz',
      description: 'Generate a quiz based on the selected text',
      prompt: 'Generate a quiz based on the selected text: "{text}", minimum 5 questions. Highlight the correct answers.',
    },
    // more actions...
  ],
  // optional: override default model list
  // modelList: prebuiltModelIds,
});

// You have to attach the CogniSelect instance to a DOM element
cogniselect.attachCogniSelectStatus('#model-indicator-container');
```

### Available Models

Use the `prebuiltModelIds` array to see all supported models:

```javascript
import { prebuiltModelIds } from '@cogniselect/sdk';
console.log(prebuiltModelIds);
```

## Development

Build the project:

```bash
npm run build
```

## Acknowledgements

This project would not be possible without the excellent work of [mlc-ai/web-llm](https://github.com/mlc-ai/web-llm), which provides the core in-browser LLM engine. We gratefully acknowledge their contribution. (Required by Apache 2.0 license.)

## License

Apache 2.0 License. See [LICENSE.md](LICENSE.md). 