// 预设动作库
const PRESET_EXERCISES = [
  // 胸
  { id: 'preset_chest_01', name: '平板杠铃卧推', muscleGroup: '胸', isCustom: false },
  { id: 'preset_chest_02', name: '上斜杠铃卧推', muscleGroup: '胸', isCustom: false },
  { id: 'preset_chest_03', name: '哑铃飞鸟', muscleGroup: '胸', isCustom: false },
  { id: 'preset_chest_04', name: '俯卧撑', muscleGroup: '胸', isCustom: false },
  { id: 'preset_chest_05', name: '绳索夹胸', muscleGroup: '胸', isCustom: false },
  // 背
  { id: 'preset_back_01', name: '引体向上', muscleGroup: '背', isCustom: false },
  { id: 'preset_back_02', name: '杠铃划船', muscleGroup: '背', isCustom: false },
  { id: 'preset_back_03', name: '高位下拉', muscleGroup: '背', isCustom: false },
  { id: 'preset_back_04', name: '坐姿划船', muscleGroup: '背', isCustom: false },
  { id: 'preset_back_05', name: '哑铃单臂划船', muscleGroup: '背', isCustom: false },
  // 肩
  { id: 'preset_shoulder_01', name: '哑铃推举', muscleGroup: '肩', isCustom: false },
  { id: 'preset_shoulder_02', name: '哑铃侧平举', muscleGroup: '肩', isCustom: false },
  { id: 'preset_shoulder_03', name: '哑铃前平举', muscleGroup: '肩', isCustom: false },
  { id: 'preset_shoulder_04', name: '面拉', muscleGroup: '肩', isCustom: false },
  // 腿
  { id: 'preset_legs_01', name: '杠铃深蹲', muscleGroup: '腿', isCustom: false },
  { id: 'preset_legs_02', name: '腿举', muscleGroup: '腿', isCustom: false },
  { id: 'preset_legs_03', name: '腿弯举', muscleGroup: '腿', isCustom: false },
  { id: 'preset_legs_04', name: '腿屈伸', muscleGroup: '腿', isCustom: false },
  { id: 'preset_legs_05', name: '罗马尼亚硬拉', muscleGroup: '腿', isCustom: false },
  { id: 'preset_legs_06', name: '保加利亚分腿蹲', muscleGroup: '腿', isCustom: false },
  // 手臂
  { id: 'preset_arm_01', name: '哑铃二头弯举', muscleGroup: '手臂', isCustom: false },
  { id: 'preset_arm_02', name: '锤式弯举', muscleGroup: '手臂', isCustom: false },
  { id: 'preset_arm_03', name: '绳索三头下压', muscleGroup: '手臂', isCustom: false },
  { id: 'preset_arm_04', name: '窄距卧推', muscleGroup: '手臂', isCustom: false },
  // 腹
  { id: 'preset_abs_01', name: '卷腹', muscleGroup: '腹', isCustom: false },
  { id: 'preset_abs_02', name: '悬垂举腿', muscleGroup: '腹', isCustom: false },
  { id: 'preset_abs_03', name: '平板支撑', muscleGroup: '腹', isCustom: false },
  // 有氧
  { id: 'preset_cardio_01', name: '跑步', muscleGroup: '有氧', isCustom: false },
  { id: 'preset_cardio_02', name: '划船机', muscleGroup: '有氧', isCustom: false },
  { id: 'preset_cardio_03', name: '动感单车', muscleGroup: '有氧', isCustom: false },
];

const MUSCLE_GROUPS = ['全部', '胸', '背', '肩', '腿', '手臂', '腹', '有氧'];
