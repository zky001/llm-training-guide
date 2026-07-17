import React, {useEffect, useRef, useState} from 'react';
import PlaygroundCard from '../PlaygroundCard';
import {Btn, BtnRow, Message, Stat, StatRow} from '../ui';
import styles from '../playground.module.css';

/**
 * A6.1：SWE 智能体重放。
 * 步进一条修 bug 的完整轨迹：读 issue → 定位 → 写复现测试 →
 * 修复 → 引入回归被测试抓住 → 再修 → 全绿 → 提交。
 * 轨迹为教学构造，流程参考真实编码智能体的工作方式。
 */

type StepType = 'issue' | 'think' | 'act' | 'observe' | 'answer';

interface Step {
  type: StepType;
  text: string;
  code?: string;
  test?: 'none' | 'red' | 'green'; // 该步之后的测试状态
}