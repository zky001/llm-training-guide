import MDXComponents from '@theme-original/MDXComponents';
import DeepDive from '@site/src/components/DeepDive';
import Quiz from '@site/src/components/Quiz';
import Term from '@site/src/components/Term';
import GlossaryTable from '@site/src/components/GlossaryTable';
import LinearFit from '@site/src/components/interactive/LinearFit';
import MatrixPlayground from '@site/src/components/interactive/MatrixPlayground';
import ProbabilityLab from '@site/src/components/interactive/ProbabilityLab';
import GradientPlayground from '@site/src/components/interactive/GradientPlayground';
import NgramPlayground from '@site/src/components/interactive/NgramPlayground';
import BpePlayground from '@site/src/components/interactive/BpePlayground';
import EmbeddingMap from '@site/src/components/interactive/EmbeddingMap';

/**
 * 注册为 MDX 全局组件：所有 .mdx 文档无需 import 即可直接使用
 * <DeepDive>、<Quiz>、<Term>、<LinearFit /> 等。
 */
export default {
  ...MDXComponents,
  DeepDive,
  Quiz,
  Term,
  GlossaryTable,
  LinearFit,
  MatrixPlayground,
  ProbabilityLab,
  GradientPlayground,
  NgramPlayground,
  BpePlayground,
  EmbeddingMap,
};
