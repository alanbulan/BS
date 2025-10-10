# -*- coding: utf-8 -*-
"""
按照南通大学毕业设计模板完整构建论文
"""

import sys
from pathlib import Path
from docx import Document
from docx.shared import Pt, Cm, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

def add_page_break(doc):
    """添加分页符"""
    doc.add_page_break()

def set_cell_border(cell, **kwargs):
    """设置单元格边框"""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for edge in ('top', 'left', 'bottom', 'right'):
        if edge in kwargs:
            edge_el = OxmlElement(f'w:{edge}')
            edge_el.set(qn('w:val'), 'single')
            edge_el.set(qn('w:sz'), str(kwargs[edge]))
            edge_el.set(qn('w:space'), '0')
            edge_el.set(qn('w:color'), '000000')
            tcBorders.append(edge_el)
    tcPr.append(tcBorders)

def setup_document_styles(doc):
    """设置文档样式 - 严格按照南通大学要求"""
    # 正文样式：小四号宋体，1.5倍行距，首行缩进2字符
    style = doc.styles['Normal']
    style.font.name = '宋体'
    style._element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')
    style.font.size = Pt(12)  # 小四号
    style.paragraph_format.line_spacing = 1.5  # 1.5倍行距
    style.paragraph_format.first_line_indent = Cm(0.74)  # 2字符
    style.paragraph_format.space_before = Pt(0)
    style.paragraph_format.space_after = Pt(0)
    style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY  # 两端对齐
    
    # 标题1 - 章标题：小二号黑体，居中，段前12磅段后18磅
    h1 = doc.styles['Heading 1']
    h1.font.name = '黑体'
    h1._element.rPr.rFonts.set(qn('w:eastAsia'), '黑体')
    h1.font.size = Pt(18)  # 小二号
    h1.font.bold = True
    h1.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER  # 居中
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(18)
    h1.paragraph_format.line_spacing = 1.5
    h1.paragraph_format.first_line_indent = Cm(0)
    
    # 标题2 - 节标题：小三号黑体，左对齐，段前6磅段后6磅
    h2 = doc.styles['Heading 2']
    h2.font.name = '黑体'
    h2._element.rPr.rFonts.set(qn('w:eastAsia'), '黑体')
    h2.font.size = Pt(15)  # 小三号
    h2.font.bold = True
    h2.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
    h2.paragraph_format.space_before = Pt(6)
    h2.paragraph_format.space_after = Pt(6)
    h2.paragraph_format.line_spacing = 1.5
    h2.paragraph_format.first_line_indent = Cm(0)
    
    # 标题3 - 小节标题：四号黑体，左对齐
    h3 = doc.styles['Heading 3']
    h3.font.name = '黑体'
    h3._element.rPr.rFonts.set(qn('w:eastAsia'), '黑体')
    h3.font.size = Pt(14)  # 四号
    h3.font.bold = True
    h3.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
    h3.paragraph_format.space_before = Pt(6)
    h3.paragraph_format.space_after = Pt(6)
    h3.paragraph_format.first_line_indent = Cm(0)

def add_cover_page(doc):
    """添加封面 - 按照模板要求"""
    # 学校名称 - 华文中宋，二号，加粗
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run('南通大学')
    run.font.name = '华文中宋'
    run._element.rPr.rFonts.set(qn('w:eastAsia'), '华文中宋')
    run.font.size = Pt(22)  # 二号
    run.font.bold = True
    
    # 空行
    for _ in range(3):
        doc.add_paragraph()
    
    # 标题 - 小二号黑体
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run('本科毕业设计')
    run.font.name = '黑体'
    run._element.rPr.rFonts.set(qn('w:eastAsia'), '黑体')
    run.font.size = Pt(18)  # 小二号
    run.font.bold = True
    
    for _ in range(2):
        doc.add_paragraph()
    
    # 论文题目表格
    table = doc.add_table(rows=5, cols=2)
    table.autofit = False
    table.allow_autofit = False
    
    # 设置列宽
    table.columns[0].width = Cm(3)
    table.columns[1].width = Cm(12)
    
    # 题目 - 三号黑体
    cell = table.cell(0, 0)
    cell.text = '题  目:'
    p = cell.paragraphs[0]
    p.paragraph_format.first_line_indent = Cm(0)
    for run in p.runs:
        run.font.name = '黑体'
        run.font.size = Pt(16)  # 三号
    
    cell = table.cell(0, 1)
    cell.text = '基于WebGIS的地质灾害风险评估与应急避险系统设计与实现'
    p = cell.paragraphs[0]
    p.paragraph_format.first_line_indent = Cm(0)
    for run in p.runs:
        run.font.name = '黑体'
        run.font.size = Pt(16)  # 三号
    
    # 学生姓名 - 小三号宋体
    table.cell(1, 0).text = '学生姓名:'
    table.cell(1, 1).text = '____________________'
    
    # 专业
    table.cell(2, 0).text = '专    业:'
    table.cell(2, 1).text = '____________________'
    
    # 指导教师
    table.cell(3, 0).text = '指导教师:'
    table.cell(3, 1).text = '____________________'
    
    # 完成日期
    table.cell(4, 0).text = '完成日期:'
    table.cell(4, 1).text = '201**年*月**日'
    
    # 设置表格字体 - 小三号宋体
    for i in range(1, 5):
        for j in range(2):
            cell = table.cell(i, j)
            for paragraph in cell.paragraphs:
                paragraph.paragraph_format.first_line_indent = Cm(0)
                paragraph.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER if j == 1 else WD_ALIGN_PARAGRAPH.LEFT
                for run in paragraph.runs:
                    run.font.name = '宋体'
                    run.font.size = Pt(15)  # 小三号
    
    # 设置表格边框为无边框
    for row in table.rows:
        for cell in row.cells:
            tc = cell._tc
            tcPr = tc.get_or_add_tcPr()
            tcBorders = OxmlElement('w:tcBorders')
            for edge in ['top', 'left', 'bottom', 'right']:
                edge_el = OxmlElement(f'w:{edge}')
                edge_el.set(qn('w:val'), 'none')
                tcBorders.append(edge_el)
            tcPr.append(tcBorders)
    
    add_page_break(doc)

def add_statement_page(doc):
    """添加诚信承诺书"""
    p = doc.add_heading('诚信承诺书', level=1)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    doc.add_paragraph()
    
    text = """本人承诺，所呈交的毕业设计是本人在导师指导下进行的研究成果。除了文中特别加以标注和致谢的部分外，其中不包含其他人已发表或撰写过的研究成果。参与同一工作的其他同志对本研究所做的任何贡献均已在文中作了明确的说明并表示了谢意。"""
    
    p = doc.add_paragraph(text)
    p.paragraph_format.first_line_indent = Cm(0.74)
    p.paragraph_format.line_spacing = 1.5
    
    doc.add_paragraph()
    doc.add_paragraph()
    
    # 签名栏
    p = doc.add_paragraph('签名: _________  日期: __________')
    p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    
    add_page_break(doc)

def add_abstract_cn(doc):
    """添加中文摘要 - 按照模板格式"""
    # 标题 - 小二号黑体，居中
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run('摘  要')
    run.font.name = '黑体'
    run._element.rPr.rFonts.set(qn('w:eastAsia'), '黑体')
    run.font.size = Pt(18)  # 小二号
    run.font.bold = True
    
    doc.add_paragraph()
    
    # 摘要内容 - 小四号宋体，1.5倍行距，首行缩进2字符
    abstract_text = """地质灾害严重威胁山区人民生命财产安全，传统的人工评估方法效率低、主观性强、缺乏实时性。本文设计并实现了基于WebGIS的地质灾害风险智能评估与应急避险系统。系统采用PostgreSQL+PostGIS空间数据库管理地理数据，布设20个监测站采集10种类型的监测数据，集成随机森林机器学习算法实现风险智能评估，基于A*算法在35,513条真实道路上规划逃生路径。系统包含Web管理端（Vue 3，71个文件）和移动端（React Native，43个文件），分别服务于专业管理人员和普通公众。测试结果表明，风险评估响应时间1.2秒，预测准确率90%，路径规划耗时8秒，各项性能指标满足需求。系统实现了监测、评估、预警、导航的全流程信息化，为地质灾害防治提供了技术支撑。"""
    
    p = doc.add_paragraph(abstract_text)
    p.style = 'Normal'
    p.paragraph_format.first_line_indent = Cm(0.74)  # 2字符
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    for run in p.runs:
        run.font.name = '宋体'
        run.font.size = Pt(12)  # 小四号
    
    doc.add_paragraph()
    
    # 关键词 - 小四号宋体，"关键词"三字加粗
    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Cm(0)
    run = p.add_run('关键词：')
    run.font.bold = True
    run.font.name = '宋体'
    run._element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')
    run.font.size = Pt(12)
    
    run = p.add_run('地质灾害；WebGIS；PostGIS；随机森林；A*算法；风险评估')
    run.font.name = '宋体'
    run._element.rPr.rFonts.set(qn('w:eastAsia'), '宋体')
    run.font.size = Pt(12)
    
    add_page_break(doc)

def add_abstract_en(doc):
    """添加英文摘要 - 按照模板格式"""
    # 标题 - 小二号Times New Roman，加粗，居中
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run('ABSTRACT')
    run.font.name = 'Times New Roman'
    run.font.size = Pt(18)  # 小二号
    run.font.bold = True
    
    doc.add_paragraph()
    
    # 英文摘要 - 小四号Times New Roman，1.5倍行距
    abstract_text = """Geological disasters seriously threaten the lives and property of people in mountainous areas. Traditional manual assessment methods are inefficient, subjective, and lack real-time capability. This paper designs and implements a geological disaster risk assessment and emergency evacuation system based on WebGIS. The system uses PostgreSQL+PostGIS spatial database to manage geographic data, deploys 20 monitoring stations to collect 10 types of monitoring data, integrates Random Forest machine learning algorithm for intelligent risk assessment, and plans escape routes on 35,513 real roads based on A* algorithm. The system includes a Web management terminal (Vue 3, 71 files) and a mobile terminal (React Native, 43 files), serving professional managers and general public respectively. Test results show that risk assessment response time is 1.2 seconds, prediction accuracy is 90%, and path planning takes 8 seconds, meeting all performance requirements."""
    
    p = doc.add_paragraph(abstract_text)
    p.paragraph_format.first_line_indent = Cm(0)
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    for run in p.runs:
        run.font.name = 'Times New Roman'
        run.font.size = Pt(12)  # 小四号
    
    doc.add_paragraph()
    
    # Keywords - 小四号Times New Roman，"Keywords"加粗
    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Cm(0)
    run = p.add_run('Keywords: ')
    run.font.bold = True
    run.font.name = 'Times New Roman'
    run.font.size = Pt(12)
    
    run = p.add_run('Geological Disaster; WebGIS; PostGIS; Random Forest; A* Algorithm; Risk Assessment')
    run.font.name = 'Times New Roman'
    run.font.size = Pt(12)
    
    add_page_break(doc)

def process_markdown_content(doc, md_file):
    """处理Markdown内容"""
    print("[5/7] 处理正文内容...")
    
    with open(md_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    skip_until_chapter = True
    in_code_block = False
    code_lines = []
    
    for line in lines:
        line = line.rstrip()
        
        # 跳过前面的摘要部分，从第1章开始
        if '# 第1章' in line or '# 第一章' in line:
            skip_until_chapter = False
        
        if skip_until_chapter:
            continue
        
        # 处理代码块
        if line.startswith('```'):
            if in_code_block:
                # 结束代码块
                if code_lines:
                    code_text = '\n'.join(code_lines)
                    p = doc.add_paragraph(code_text)
                    p.style = 'Normal'
                    p.paragraph_format.first_line_indent = Cm(0)
                    p.paragraph_format.left_indent = Cm(1)
                    for run in p.runs:
                        run.font.name = 'Consolas'
                        run.font.size = Pt(9)
                code_lines = []
                in_code_block = False
            else:
                in_code_block = True
            continue
        
        if in_code_block:
            code_lines.append(line)
            continue
        
        # 跳过特殊标记
        if line.strip() in ['\\pagebreak', '---', '***', '___'] or not line.strip():
            continue
        
        # 处理标题
        if line.startswith('# ') and not line.startswith('## '):
            title = line[2:].strip().replace('**', '')
            doc.add_heading(title, level=1)
        elif line.startswith('## '):
            title = line[3:].strip().replace('**', '')
            doc.add_heading(title, level=2)
        elif line.startswith('### '):
            title = line[4:].strip().replace('**', '')
            doc.add_heading(title, level=3)
        # 处理表格（简化）
        elif line.startswith('|'):
            if '---' not in line:
                p = doc.add_paragraph(line)
                p.style = 'Normal'
                p.paragraph_format.first_line_indent = Cm(0)
        # 处理列表
        elif line.strip().startswith(('- ', '* ', '1. ', '2. ')):
            text = line.strip()[2:] if line.strip()[1] == ' ' else line.strip()[3:]
            text = text.replace('**', '').replace('`', '')
            p = doc.add_paragraph('• ' + text)
            p.style = 'Normal'
            p.paragraph_format.first_line_indent = Cm(0)
            p.paragraph_format.left_indent = Cm(0.74)
        # 处理普通段落
        else:
            text = line.strip().replace('**', '').replace('`', '')
            if text:
                p = doc.add_paragraph(text)
                p.style = 'Normal'

def build_thesis():
    """构建完整论文"""
    print("=" * 60)
    print("    南通大学毕业设计论文生成")
    print("=" * 60)
    print()
    
    base_dir = Path(__file__).parent
    md_file = base_dir / "毕业论文-完整版.md"
    template_file = Path(r"D:\BS\模板.docx")
    output_file = base_dir / "毕业论文-南通大学格式.docx"
    
    if not md_file.exists():
        print(f"[错误] 找不到: {md_file}")
        return
    
    print(f"[1/7] 读取模板: {template_file.name}")
    if template_file.exists():
        doc = Document(str(template_file))
    else:
        doc = Document()
    
    print("[2/7] 设置文档样式...")
    setup_document_styles(doc)
    
    print("[3/7] 添加封面...")
    add_cover_page(doc)
    
    print("[4/7] 添加前置页面...")
    add_statement_page(doc)
    add_abstract_cn(doc)
    add_abstract_en(doc)
    
    # 添加目录页（需要手动在Word中更新）
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run('目录')
    run.font.name = '黑体'
    run.font.size = Pt(16)
    run.font.bold = True
    
    doc.add_paragraph()
    p = doc.add_paragraph('[请在Word中插入→引用→目录]')
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    add_page_break(doc)
    
    # 处理正文
    process_markdown_content(doc, md_file)
    
    print("[6/7] 保存文档...")
    doc.save(output_file)
    
    print("[7/7] 完成!")
    print()
    print("=" * 60)
    print("    生成成功！")
    print("=" * 60)
    print()
    print(f"输出: {output_file}")
    print(f"大小: {output_file.stat().st_size / 1024:.2f} KB")
    print()
    print("后续操作：")
    print("  1. 打开Word文档")
    print("  2. 填写封面信息（姓名、专业、指导教师）")
    print("  3. 在目录页：引用→目录→自动目录")
    print("  4. 检查格式并手动调整表格")
    print("  5. 插入图片")
    print()

if __name__ == '__main__':
    build_thesis()

