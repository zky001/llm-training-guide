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
import NeuronPlayground from '@site/src/components/interactive/NeuronPlayground';
import ReluStack from '@site/src/components/interactive/ReluStack';
import LossSurface from '@site/src/components/interactive/LossSurface';
import BackpropAnimation from '@site/src/components/interactive/BackpropAnimation';
import TrainingLab from '@site/src/components/interactive/TrainingLab';
import AttentionPlayground from '@site/src/components/interactive/AttentionPlayground';
import TransformerFlow from '@site/src/components/interactive/TransformerFlow';
import SamplingPlayground from '@site/src/components/interactive/SamplingPlayground';
import DataPipeline from '@site/src/components/interactive/DataPipeline';
import ScalingCalculator from '@site/src/components/interactive/ScalingCalculator';
import ParallelismViz from '@site/src/components/interactive/ParallelismViz';
import RlhfLab from '@site/src/components/interactive/RlhfLab';
import KvCacheDemo from '@site/src/components/interactive/KvCacheDemo';
import QuantizationDemo from '@site/src/components/interactive/QuantizationDemo';
import JudgeGame from '@site/src/components/interactive/JudgeGame';
import MoeDemo from '@site/src/components/interactive/MoeDemo';
import Panorama from '@site/src/components/interactive/Panorama';
import TracePlayer from '@site/src/components/interactive/TracePlayer';
import ToolCallLab from '@site/src/components/interactive/ToolCallLab';
import PlannerCompare from '@site/src/components/interactive/PlannerCompare';

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
  NeuronPlayground,
  ReluStack,
  LossSurface,
  BackpropAnimation,
  TrainingLab,
  AttentionPlayground,
  TransformerFlow,
  SamplingPlayground,
  DataPipeline,
  ScalingCalculator,
  ParallelismViz,
  RlhfLab,
  KvCacheDemo,
  QuantizationDemo,
  JudgeGame,
  MoeDemo,
  Panorama,
  TracePlayer,
  ToolCallLab,
  PlannerCompare,
};
