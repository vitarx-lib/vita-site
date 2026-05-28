/**
 * 用于修改和补全 HTML 文档的工具类。
 * 提供链式调用的方式来修改 HTML 文档的语言、标题、元数据、SSR 内容和脚本等。
 *
 * 核心功能：
 * - 设置 HTML 文档的语言属性
 * - 设置或更新文档标题
 * - 设置或更新元数据标签
 * - 注入 SSR（服务端渲染）内容
 * - 注入 JavaScript 脚本
 *
 * @example
 * const patcher = new HtmlPatcher('<html><head></head><body></body></html>');
 * const modifiedHtml = patcher
 *   .setLang('zh-CN')
 *   .setTitle('示例页面')
 *   .setMeta('description', '这是一个示例页面')
 *   .injectScript('console.log("Hello!");')
 *   .get();
 *
 * @param html - 原始 HTML 文档字符串
 *
 * 使用限制：
 * - 该类不会验证 HTML 的有效性，假设输入的 HTML 是格式良好的
 * - 修改操作是直接在内部字符串上进行的，多次调用相同方法会覆盖之前的修改
 * - 注入操作（如 replace）会直接替换匹配的内容，请确保选择器的准确性
 */
export class HtmlPatcher {
  constructor(private html: string) {}

  /**
   * 设置HTML文档的lang属性
   * @param lang - 要设置的语言代码，例如"en"、"zh-CN"等
   * @returns 返回当前对象实例，支持链式调用
   */
  setLang(lang: string): this {
    // 使用正则表达式匹配HTML标签及其属性
    this.html = this.html.replace(/<html([^>]*)>/, (match, attrs) => {
      // 检查是否已存在lang属性
      if (/lang=/.test(attrs)) {
        // 如果已存在lang属性，则替换其值
        return match.replace(/lang=["'][^"']*["']/, `lang="${lang}"`)
      }
      // 如果不存在lang属性，则添加该属性
      return `<html${attrs} lang="${lang}">`
    })
    return this
  }

  /**
   * 设置HTML文档的标题
   * @param title - 要设置的标题文本
   * @returns 返回当前实例，支持链式调用
   */
  setTitle(title: string): this {
    // 检查HTML中是否已包含<title>标签
    if (this.html.includes('<title>')) {
      // 如果存在<title>标签，则替换其中的内容
      this.html = this.html.replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    } else {
      // 如果不存在<title>标签，则在</head>标签前插入新的<title>标签
      this.html = this.html.replace(/<\/head>/, `<title>${title}</title></head>`)
    }
    return this // 返回当前实例以支持链式调用
  }

  /**
   * 设置HTML文档中的meta标签
   * @param name - meta标签的name属性值
   * @param content - meta标签的content属性值
   * @returns 返回当前对象实例，支持链式调用
   */
  setMeta(name: string, content: string): this {
    // 创建一个正则表达式，用于匹配指定name属性的meta标签
    const regex = new RegExp(`<meta[^>]+name=["']${name}["'][^>]*>`)

    // 创建要插入或替换的meta标签字符串
    const tag = `<meta name="${name}" content="${content}">`

    // 检查HTML中是否已存在指定name的meta标签
    if (regex.test(this.html)) {
      // 如果存在，则替换现有的meta标签
      this.html = this.html.replace(regex, tag)
    } else {
      // 如果不存在，则在</head>标签前插入新的meta标签
      this.html = this.html.replace('</head>', `${tag}</head>`)
    }

    return this // 返回当前对象实例，支持链式调用
  }

  /**
   * 替换HTML字符串中指定选择器的内容
   * @param selector - 要被替换的选择器字符串
   * @param html - 用于替换的新HTML内容
   * @returns 返回当前实例，支持链式调用
   */
  replace(selector: string, html: string): this {
    this.html = this.html.replace(selector, html) // 使用新的HTML内容替换匹配选择器的部分
    return this // 返回当前实例以支持链式调用
  }

  /**
   * 向HTML文档中注入JavaScript代码的方法
   * @param code - 要注入的JavaScript代码字符串
   * @returns 返回当前对象实例，支持链式调用
   */
  injectScript(code: string): this {
    // 将传入的JavaScript代码插入到HTML文档的</body>标签之前
    // 使用正则表达式找到</body>标签，并将代码插入到它前面
    this.html = this.html.replace('</body>', `<script>${code}</script>\n</body>`)
    return this // 返回当前对象实例，支持链式调用
  }

  /**
   * 获取HTML内容的方法
   * @returns {string} 返回存储的HTML字符串
   */
  get(): string {
    return this.html // 返回当前实例中存储的html属性值
  }
}
