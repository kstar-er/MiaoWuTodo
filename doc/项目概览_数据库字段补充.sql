-- ============================================================
-- 项目概览大屏 - 数据库字段补充脚本
-- 对应文档: doc/项目流程状态统揽图.md
-- 说明: 概览图所需的字段中，后端 eam_project_information 表缺失以下字段
--       执行下方 ALTER 语句即可补全，配合前端 projectOverviewDialog.vue 使用
-- ============================================================

-- 切换到对应数据库（请按实际情况修改数据库名）
-- USE your_db_name;

-- 1. 客户/来源 —— 概览图「客户/来源」列
--    例: 恒达科技、内部孵化
ALTER TABLE `eam_project_information`
  ADD COLUMN `customer_source` VARCHAR(100) NULL DEFAULT NULL COMMENT '客户/来源' AFTER `project_name`;

-- 2. 优先级 —— 概览图「优先级」列
--    例: 高、中、低
ALTER TABLE `eam_project_information`
  ADD COLUMN `priority` VARCHAR(20) NULL DEFAULT NULL COMMENT '优先级(高/中/低)' AFTER `customer_source`;

-- 3. 当前阶段 —— 概览图「当前阶段」列
--    例: 开发中、测试/QA、待审批、归档
ALTER TABLE `eam_project_information`
  ADD COLUMN `current_stage` VARCHAR(50) NULL DEFAULT NULL COMMENT '当前阶段' AFTER `priority`;

-- 4. 整体进度 —— 概览图「整体进度」列
--    0~100 的百分比数值
ALTER TABLE `eam_project_information`
  ADD COLUMN `overall_progress` INT(3) NULL DEFAULT 0 COMMENT '整体进度(0-100)' AFTER `current_stage`;

-- 5. 流程状态(卡点提醒) —— 概览图「流程状态(卡点提醒)」列
--    例: ⚠️ 风险：后端接口延误、🟢 正常：测试进行中
ALTER TABLE `eam_project_information`
  ADD COLUMN `process_status` VARCHAR(200) NULL DEFAULT NULL COMMENT '流程状态/卡点提醒' AFTER `overall_progress`;

-- 6. 计划上线日 —— 概览图「计划上线日」列
ALTER TABLE `eam_project_information`
  ADD COLUMN `plan_online_date` DATE NULL DEFAULT NULL COMMENT '计划上线日' AFTER `process_status`;

-- 7. 项目经理 —— 概览图「项目经理」列
--    单一负责人姓名
ALTER TABLE `eam_project_information`
  ADD COLUMN `project_manager` VARCHAR(50) NULL DEFAULT NULL COMMENT '项目经理' AFTER `plan_online_date`;

-- 8. 阶段停留天数 —— 概览图「阶段停留天数」列
--    当前阶段已停留的天数
ALTER TABLE `eam_project_information`
  ADD COLUMN `stage_stay_days` INT(5) NULL DEFAULT 0 COMMENT '阶段停留天数' AFTER `project_manager`;


-- ============================================================
-- 字段与前端 projectOverviewDialog.vue 的映射关系
-- ============================================================
-- | 概览图列名           | 数据库字段           | 前端字段(JS驼峰)     |
-- |---------------------|---------------------|---------------------|
-- | 项目编号             | id                  | id (格式化为 P-001) |
-- | 项目名称             | project_name        | projectName         |
-- | 客户/来源            | customer_source     | customerSource      |  ← 新增
-- | 优先级               | priority            | priority            |  ← 新增
-- | 当前阶段             | current_stage       | currentStage        |  ← 新增
-- | 整体进度             | overall_progress    | overallProgress     |  ← 新增
-- | 流程状态(卡点提醒)    | process_status      | processStatus       |  ← 新增
-- | 计划上线日           | plan_online_date    | planOnlineDate      |  ← 新增
-- | 项目经理             | project_manager     | projectManager      |  ← 新增
-- | 阶段停留天数         | stage_stay_days     | stageStayDays       |  ← 新增
-- ============================================================


-- ============================================================
-- 可选: 给已有项目填充默认值（按需执行）
-- ============================================================
-- 将旧项目的整体进度按 schedule 推断初始值
-- UPDATE `eam_project_information`
--   SET `overall_progress` = CASE
--     WHEN `schedule` = '已完成' THEN 100
--     WHEN `schedule` = '正在进行中' THEN 50
--     ELSE 0
--   END
--   WHERE `overall_progress` IS NULL OR `overall_progress` = 0;
--
-- 默认流程状态
-- UPDATE `eam_project_information`
--   SET `process_status` = '🟢 正常'
--   WHERE `process_status` IS NULL;
