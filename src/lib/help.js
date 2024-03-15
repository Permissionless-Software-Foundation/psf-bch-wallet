import core from '@oclif/core'
import util from '@oclif/core/lib/help/util.js'
import util$0 from '@oclif/core/lib/util'
import config from '@oclif/core/lib/config/config'
import errors from '@oclif/core/lib/errors'
import tempRootHelp from '@oclif/core/lib/help/root.js'
import Conf from 'conf'
import CommandHelp from '@oclif/core/lib/help/command.js'
/*
  This library modified the default Help class in oclif. This customized class
  library allows the program to hide certain commands based on the config
  settings.
*/
// const { Command, HelpBase } = require('@oclif/core')
const { HelpBase } = core
const { formatCommandDeprecationWarning, getHelpFlagAdditions, standardizeIDFromArgv, toConfiguredId } = util
const { sortBy, uniqBy } = util$0
const { toCached } = config
const { error } = errors
const RootHelp = tempRootHelp.default
class CustomHelp extends HelpBase {
  constructor (argv) {
    super(argv)
    this.conf = new Conf()
  }

  // THIS IS THE CUSTOM FUNCTION ADDED BY PSF TO SELECTIVELY SHOW HELP.
  // This function expects an array of objects as input. Each object is a command.
  // The array will be filtered in place and returned.
  // Commands are removed from the array, based on the config settings.
  // The purpose of this filter is to reduce the number of commands the user sees
  // unless they want to turn on categories of commands for advanced usage.
  filterCommands (cmdAry) {
    try {
      // console.log('cmdAry: ', cmdAry)
      // Hide or show ipfs-* commands.
      const showIpfsCmds = this.conf.get('cmdIpfs', false)
      if (!showIpfsCmds || showIpfsCmds === 'false') {
        // Ensure the config setting is explicitly defined.
        this.conf.set('cmdIpfs', 'false')
        // Filter out the IPFS commands.
        cmdAry = cmdAry.filter(x => !x.id.includes('ipfs-'))
      }
      // Hide or show vote-* commands.
      const showVoteCmds = this.conf.get('cmdVote', false)
      if (!showVoteCmds || showVoteCmds === 'false') {
        // Ensure the config setting is explicitly defined.
        this.conf.set('cmdVote', 'false')
        // Filter out the vote commands.
        cmdAry = cmdAry.filter(x => !x.id.includes('vote-'))
      }
      // Hide or show mc-* commands for the Minting Council
      const showMcCmds = this.conf.get('cmdMc', false)
      if (!showMcCmds || showMcCmds === 'false') {
        // Ensure the config setting is explicitly defined.
        this.conf.set('cmdMc', 'false')
        // Filter out the vote commands.
        cmdAry = cmdAry.filter(x => !x.id.includes('mc-'))
      }
      // Hide or show psffpp-* commands.
      const showPsffppCmds = this.conf.get('cmdPsffpp', false)
      if (!showPsffppCmds || showPsffppCmds === 'false') {
        // Ensure the config setting is explicitly defined.
        this.conf.set('showPsffppCmds', 'false')
        // Filter out the psffpp-* commands.
        cmdAry = cmdAry.filter(x => !x.id.includes('showPsffppCmds-'))
      }
      return cmdAry
    } catch (err) {
      console.error('Error in help.js/filterCommands(): ', err)
      throw err
    }
  }

  async showHelp (argv) {
    // console.log('This will be displayed in multi-command CLIs')
    const originalArgv = argv.slice(1)
    argv = argv.filter(arg => !getHelpFlagAdditions(this.config).includes(arg))
    if (this.config.topicSeparator !== ':') { argv = standardizeIDFromArgv(argv, this.config) }
    const subject = getHelpSubject(argv, this.config)
    if (!subject) {
      if (this.config.pjson.oclif.default) {
        const rootCmd = this.config.findCommand(this.config.pjson.oclif.default)
        if (rootCmd) {
          await this.showCommandHelp(rootCmd)
          return
        }
      }
      await this.showRootHelp()
      return
    }
    const command = this.config.findCommand(subject)
    if (command) {
      if (command.hasDynamicHelp) {
        const dynamicCommand = await toCached(await command.load())
        await this.showCommandHelp(dynamicCommand)
      } else {
        await this.showCommandHelp(command)
      }
      return
    }
    const topic = this.config.findTopic(subject)
    if (topic) {
      await this.showTopicHelp(topic)
      return
    }
    if (this.config.flexibleTaxonomy) {
      const matches = this.config.findMatches(subject, originalArgv)
      if (matches.length > 0) {
        const result = await this.config.runHook('command_incomplete', { id: subject, argv: originalArgv, matches })
        if (result.successes.length > 0) { return }
      }
    }
    error(`Command ${subject} not found.`)
  }

  async showRootHelp () {
    let rootTopics = this.sortedTopics()
    let rootCommands = this.sortedCommands()
    const state = this.config.pjson?.oclif?.state
    if (state) {
      this.log(state === 'deprecated'
        ? `${this.config.bin} is deprecated`
        : `${this.config.bin} is in ${state}.\n`)
    }
    this.log(this.formatRoot())
    this.log('')
    if (!this.opts.all) {
      // console.log('rootTopics: ', rootTopics)
      rootTopics = rootTopics.filter(t => !t.name.includes(':'))
      // console.log('rootCommands: ', rootCommands)
      rootCommands = rootCommands.filter(c => !c.id.includes(':'))
    }
    if (rootTopics.length > 0) {
      // console.log('rootTopics: ', rootTopics)
      this.log(this.formatTopics(rootTopics))
      this.log('')
    }
    if (rootCommands.length > 0) {
      rootCommands = rootCommands.filter(c => c.id)
      // console.log('rootCommands: ', rootCommands)
      // Filter the commands, based on the config settings.
      rootCommands = this.filterCommands(rootCommands)
      this.log(this.formatCommands(rootCommands))
      this.log('')
    }
  }

  formatRoot () {
    const help = new RootHelp(this.config, this.opts)
    return help.root()
  }

  log (...args) {
    console.log(...args)
  }

  sortedCommands () {
    let commands = this.config.commands
    commands = commands.filter(c => this.opts.all || !c.hidden)
    commands = sortBy(commands, c => c.id)
    commands = uniqBy(commands, c => c.id)
    return commands
  }

  sortedTopics () {
    let topics = this._topics()
    topics = topics.filter(t => this.opts.all || !t.hidden)
    topics = sortBy(topics, t => t.name)
    topics = uniqBy(topics, t => t.name)
    return topics
  }

  _topics () {
    return this.config.topics.filter((topic) => {
      // it is assumed a topic has a child if it has children
      const hasChild = this.config.topics.some(subTopic => subTopic.name.includes(`${topic.name}:`))
      return hasChild
    })
  }

  formatCommands (commands) {
    if (commands.length === 0) { return '' }
    const body = this.renderList(commands.map(c => {
      if (this.config.topicSeparator !== ':') { c.id = c.id.replace(/:/g, this.config.topicSeparator) }
      return [
        c.id,
        this.summary(c)
      ]
    }), {
      spacer: '\n',
      stripAnsi: this.opts.stripAnsi,
      indentation: 2
    })
    return this.section('COMMANDS', body)
  }

  summary (c) {
    if (c.summary) { return this.render(c.summary.split('\n')[0]) }
    return c.description && this.render(c.description).split('\n')[0]
  }

  // Used by the prepack script.
  formatCommand (command) {
    if (this.config.topicSeparator !== ':') {
      command.id = command.id.replace(/:/g, this.config.topicSeparator)
      command.aliases = command.aliases && command.aliases.map(a => a.replace(/:/g, this.config.topicSeparator))
    }
    const help = this.getCommandHelpClass(command)
    const generatedHelp = help.generate()
    // console.log('generatedHelp: ', generatedHelp)
    return generatedHelp
  }

  getCommandHelpClass (command) {
    const CommandHelp2 = CommandHelp.default
    return new CommandHelp2(command, this.config, this.opts)
  }

  // CommandHelpClass {
  //   return typeof CommandHelp = CommandHelp
  // }
  async showCommandHelp (command) {
    // console.log('command: ', command)
    const name = command.id
    const depth = name.split(':').length
    const subTopics = this.sortedTopics().filter(t => t.name.startsWith(name + ':') && t.name.split(':').length === depth + 1)
    const subCommands = this.sortedCommands().filter(c => c.id.startsWith(name + ':') && c.id.split(':').length === depth + 1)
    const plugin = this.config.plugins.find(p => p.name === command.pluginName)
    const state = this.config.pjson?.oclif?.state || plugin?.pjson?.oclif?.state || command.state
    if (state) {
      this.log(state === 'deprecated'
        ? `${formatCommandDeprecationWarning(toConfiguredId(name, this.config), command.deprecationOptions)}`
        : `This command is in ${state}.\n`)
    }
    const summary = this.summary(command)
    if (summary) {
      this.log(summary + '\n')
    }
    // console.log('command: ', command)
    this.log(this.formatCommand(command))
    this.log('')
    // console.log('subTopics: ', subTopics)
    if (subTopics.length > 0) {
      this.log(this.formatTopics(subTopics))
      this.log('')
    }
    // console.log('subCommands: ', subCommands)
    if (subCommands.length > 0) {
      const aliases = []
      const uniqueSubCommands = subCommands.filter(p => {
        aliases.push(...p.aliases)
        return !aliases.includes(p.id)
      })
      this.log(this.formatCommands(uniqueSubCommands))
      this.log('')
    }
  }
}
function getHelpSubject (args, config) {
  // for each help flag that starts with '--' create a new flag with same name sans '--'
  const mergedHelpFlags = getHelpFlagAdditions(config)
  for (const arg of args) {
    if (arg === '--') { return }
    if (mergedHelpFlags.includes(arg) || arg === 'help') { continue }
    if (arg.startsWith('-')) { return }
    return arg
  }
}
export default CustomHelp
