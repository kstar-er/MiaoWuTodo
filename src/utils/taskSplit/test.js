/**
 * 任务拆分功能测试脚本
 * 在浏览器控制台中运行此脚本来测试API
 */

// 测试数据
const testTaskContent = `完成网站开发项目

1. 需求分析
   分析用户需求和业务流程，确定功能范围

2. 系统设计  
   设计系统架构、数据库结构和接口规范

3. 前端开发
   实现用户界面和交互功能

4. 后端开发
   开发API接口和业务逻辑

5. 测试部署
   进行功能测试和系统部署`;

// 测试规则拆分的正则表达式
function testRuleSplit(content) {
  const pattern = /(?:^|\n)\s*([1-9]\d*)[.、：:]\s*([^\n]+)(?:\n([^\n1-9]*(?:\n(?!\s*[1-9]\d*[.、：:])[^\n]*)*))?/gm;
  const matches = [];
  let match;
  
  while ((match = pattern.exec(content)) !== null) {
    matches.push({
      number: match[1],
      title: match[2].trim(),
      content: match[3] ? match[3].trim() : '',
      order: matches.length + 1
    });
  }
  
  return matches;
}

// 运行测试
console.log('=== 任务拆分功能测试 ===');
console.log('原始任务内容：');
console.log(testTaskContent);
console.log('\n拆分结果：');

const splitResult = testRuleSplit(testTaskContent);
splitResult.forEach((item, index) => {
  console.log(`子任务 ${item.order}:`);
  console.log(`  标题: ${item.title}`);
  console.log(`  内容: ${item.content}`);
  console.log('---');
});

console.log(`总共拆分出 ${splitResult.length} 个子任务`);

// 导出测试函数供其他地方使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testRuleSplit };
}