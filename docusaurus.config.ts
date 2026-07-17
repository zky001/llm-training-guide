import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const config: Config = {
  title: '大模型是怎么炼成的',
  tagline: '从「预测下一个词」到 RLHF —— 人人都能看懂的大模型训练交互式图解教程',
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

  themes: ['@docusaurus/theme-mermaid', '@easyops-cn/docusaurus-search-local'],

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
        '🚧 项目持续建设中，第 0~5 章已上线（19 个交互实验）。欢迎 <a target="_blank" rel="noopener noreferrer" href="https://github.com/zky001/llm-training-guide">Star ⭐ 与参与共建</a>！',
      isCloseable: true,
    },
    navbar: {
      title: '大模型是怎么炼成的',
      logo: {
        alt: 'Logo',
        src: 'img/logo.svg',
      },
      items: [
        {type: 'docSidebar', sidebarId: 'guideSidebar', position: 'left', label: '📖 教程'},
        {to: '/docs/appendix/glossary', label: '术语表', position: 'left'},
        {to: '/docs/appendix/resources', label: '延伸资料', position: 'left'},
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
