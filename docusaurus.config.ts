import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const config: Config = {
  title: '大模型是怎么炼成的',
  tagline: '从「预测下一个词」到「自主行动」—— 人人都能看懂的大模型与智能体交互式图解教程',
  favicon: 'img/logo.svg',

  url: 'https://zky001.github.io',
  baseUrl: '/llm-training-guide/',
  organizationName: 'zky001',
  projectName: 'llm-training-guide',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  themes: [
    '@docusaurus/theme-mermaid',
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['zh', 'en'],
        docsRouteBasePath: ['docs', 'kb', 'agents'],
        docsDir: ['docs', 'kb', 'agents'],
      },
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'kb',
        path: 'kb',
        routeBasePath: 'kb',
        sidebarPath: './sidebarsKb.ts',
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeKatex],
        editUrl: 'https://github.com/zky001/llm-training-guide/edit/main/',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'agents',
        path: 'agents',
        routeBasePath: 'agents',
        sidebarPath: './sidebarsAgents.ts',
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeKatex],
        editUrl: 'https://github.com/zky001/llm-training-guide/edit/main/',
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
          editUrl: 'https://github.com/zky001/llm-training-guide/edit/main/',
          showLastUpdateTime: false,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    announcementBar: {
      id: 'wip',
      content:
        '🎉 上下篇完稿 · 📚 中篇《给 AI 接上你的知识（RAG）》连载中：K0~K5 已上线。欢迎 <a target="_blank" rel="noopener noreferrer" href="https://github.com/zky001/llm-training-guide">Star ⭐ 与参与共建</a>！',
      isCloseable: true,
    },
    navbar: {
      title: '大模型是怎么炼成的',
      logo: {
        alt: 'Logo',
        src: 'img/logo.svg',
      },
      items: [
        {type: 'docSidebar', sidebarId: 'guideSidebar', position: 'left', label: '📖 上篇 · 大模型'},
        {
          type: 'docSidebar',
          sidebarId: 'kbSidebar',
          docsPluginId: 'kb',
          position: 'left',
          label: '📚 中篇 · 知识库',
        },
        {
          type: 'docSidebar',
          sidebarId: 'agentsSidebar',
          docsPluginId: 'agents',
          position: 'left',
          label: '🤖 下篇 · 智能体',
        },
        {to: '/docs/appendix/glossary', label: '术语表', position: 'left'},
        {
          href: 'https://github.com/zky001/llm-training-guide',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '学习',
          items: [
            {label: '导读：如何使用本教程', to: '/docs/intro'},
            {label: '第 0 章 · 预备知识', to: '/docs/prerequisites'},
            {label: '第 1 章 · 什么是语言模型', to: '/docs/language-models'},
            {label: '第 2 章 · 神经网络与训练三件套', to: '/docs/neural-networks'},
            {label: '第 3 章 · Transformer 架构', to: '/docs/transformer'},
            {label: '中篇 · 给 AI 接上你的知识（RAG）', to: '/kb/intro'},
            {label: '下篇 · 智能体是怎么工作的', to: '/agents/intro'},
          ],
        },
        {
          title: '参与',
          items: [
            {label: 'GitHub', href: 'https://github.com/zky001/llm-training-guide'},
            {label: '报告问题 / 提建议', href: 'https://github.com/zky001/llm-training-guide/issues'},
          ],
        },
        {
          title: '更多',
          items: [
            {label: '术语表', to: '/docs/appendix/glossary'},
            {label: '延伸资料', to: '/docs/appendix/resources'},
          ],
        },
      ],
      copyright: `代码 MIT 许可 · 内容 CC BY-SA 4.0 · 用 ❤️ 和 Docusaurus 构建`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['python', 'bash'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
