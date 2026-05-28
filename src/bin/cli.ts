#!/usr/bin/env node
import { program } from 'commander'
import { setLogPrefix } from 'vitarx-router/file-router'
import { getVersion } from '../server/index.js'
import { cleanCommandHandler } from './commands/clean.js'
import { createServerCommandHandler } from './commands/server.js'

setLogPrefix('vita-site')

const commands = [
  { name: 'dev', description: '启动开发服务器' },
  { name: 'build', description: '生产构建' },
  { name: 'preview', description: '预览生产版本' }
] as const

program
  .name('vita-site')
  .description('Static site generator for Vitarx framework')
  .usage('[command] [options]')
  .version(getVersion(), '-v, --version', '显示版本号')
  .helpOption('-h, --help', '显示帮助信息')
  .helpCommand('help [command]', '显示指定命令的帮助信息')
  .addHelpText(
    'after',
    `
示例:
  $ vita-site dev          启动开发服务器
  $ vita-site build        构建生产版本
  $ vita-site preview      预览生产版本
  $ vita-site clean        清除缓存
`
  )

for (const command of commands) {
  program
    .command(command.name)
    .description(command.description)
    .option('-d, --debug', '启用调试模式', false)
    .option('-h, --host <host>', '主机地址')
    .option('-p, --port <port>', '端口号')
    .option('-o, --open', '自动打开浏览器', false)
    .option('-c, --config <path>', '配置文件路径')
    .option('-f, --force', '强制清空缓存', false)
    .action(createServerCommandHandler(command.name))
}

program.command('clean').description('清除缓存').action(cleanCommandHandler)

program.parse()
