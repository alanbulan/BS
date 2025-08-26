// 简单脚本：提取 PDF 文本并保存到 txt，供后续正则抽取数据表结构使用
// 函数级注释: main() 负责读取 PDF、输出文本，extractSections() 负责按标题切分内容

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

/**
 * 从 PDF 文本中粗粒度提取“监测站(监测数据)”等章节
 * @param {string} text 完整 PDF 文本
 * @returns {Record<string,string>} 各章节名到纯文本的映射
 */
function extractSections(text) {
  const sections = {};
  // 常见中文标题前缀，后续可以按需扩展
  const titles = [
    'monitoring_stations',
    'monitoring_data',
    'monitoring_station_types',
    'risk_zones',
    'users'
  ];

  // 将所有行拿出来，按包含标题的行做分段
  const lines = text.split(/\r?\n/);
  let current = null;
  for (const line of lines) {
    const trimmed = line.trim();
    const hit = titles.find(t => trimmed.toLowerCase().includes(t));
    if (hit) {
      current = hit;
      if (!sections[current]) sections[current] = '';
    } else if (current) {
      sections[current] += line + '\n';
    }
  }
  return sections;
}

/**
 * 主函数：读取 PDF 并输出到 txt，同时导出粗分章节的 json
 */
async function main() {
  const pdfPath = path.resolve('..', 'disaster-risk-system', 'docs', 'DataDictionary_20250820210135.pdf');
  const outTxt = path.resolve('extracted.txt');
  const outJson = path.resolve('sections.json');

  const dataBuffer = fs.readFileSync(pdfPath);
  const data = await pdf(dataBuffer);
  fs.writeFileSync(outTxt, data.text, 'utf8');

  const sections = extractSections(data.text);
  fs.writeFileSync(outJson, JSON.stringify(sections, null, 2), 'utf8');
  console.log('PDF 提取完成:', { outTxt, outJson });
}

main().catch(err => {
  console.error('提取失败', err);
  process.exit(1);
});