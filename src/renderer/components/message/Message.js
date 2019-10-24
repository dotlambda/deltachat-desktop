const React = require('react')
const classNames = require('classnames')

const MessageBody = require('./MessageBody')
const MessageMetaData = require('./MessageMetaData')

const ContactName = require('../conversations/ContactName')
const { ContextMenu, ContextMenuTrigger, MenuItem } = require('react-contextmenu')
const Attachment = require('./Attachment')

const Avatar = ({ contact }) => {
  const {
    profileImage,
    color,
    name,
    address
  } = contact

  const alt = `${name || address}`

  if (profileImage) {
    return (
      <div className='module-message__author-avatar'>
        <img alt={alt} src={profileImage} />
      </div>
    )
  } else {
    return (
      <div className='module-message__author-default-avatar'
        alt={alt}
      >
        <div
          style={{ backgroundColor: color }}
          className='module-message__author-default-avatar__label'>
          {(name && name.trim()[0]) || '#'}
        </div>
      </div>
    )
  }
}

const Author = ({ contact }) => {
  const {
    color,
    name,
    address
  } = contact

  return (
    <div className='module-message__author'>
      <ContactName
        email={address}
        name={name}
        module='module-message__author'
        color={color}
      />
    </div>
  )
}

class Message extends React.Component {
  constructor (props) {
    super(props)

    this.captureMenuTrigger = this.captureMenuTrigger.bind(this)
    this.showMenu = this.showMenu.bind(this)

    this.menuTriggerRef = null
    this.state = {
      textSelected: false
    }
  }

  renderText () {
    const { text, direction, status, onShowDetail } = this.props
    const tx = window.translate

    const contents =
      direction === 'incoming' && status === 'error'
        ? tx('incomingError')
        : text

    if (!contents) {
      return null
    }

    // TODO another check - don't check it only over string
    const longMessage = /\[.{3}\]$/.test(text)

    return (
      <div
        dir='auto'
        className={classNames(
          'module-message__text',
          `module-message__text--${direction}`,
          status === 'error' && direction === 'incoming'
            ? 'module-message__text--error'
            : null
        )}
      >
        <MessageBody text={contents || ''} />
        {longMessage && <button onClick={onShowDetail}>...</button>}
      </div>
    )
  }

  captureMenuTrigger (triggerRef) {
    this.menuTriggerRef = triggerRef
  }

  showMenu (event) {
    if (this.menuTriggerRef) {
      this.setState({ textSelected: window.getSelection().toString() !== '' })
      this.menuTriggerRef.handleContextClick(event)
    }
  }

  renderMenu (isCorrectSide, triggerId) {
    const {
      attachment,
      direction,
      disableMenu,
      onDownload,
      onReply,
      viewType
    } = this.props
    const tx = window.translate

    if (!isCorrectSide || disableMenu) {
      return null
    }

    const downloadButton = attachment && viewType !== 23 ? (
      <div
        onClick={onDownload}
        role='button'
        className={classNames(
          'module-message__buttons__download'
        )}
        aria-label={tx('save')}
      />
    ) : null

    const replyButton = (
      <div
        onClick={onReply}
        role='button'
        className={classNames(
          'module-message__buttons__reply'
        )}
      />
    )

    const menuButton = (
      <ContextMenuTrigger id={triggerId} ref={this.captureMenuTrigger}>
        <div
          role='button'
          onClick={this.showMenu}
          className={classNames(
            'module-message__buttons__menu'
          )}
          aria-label={tx('a11y_message_context_menu_btn_label')}
        />
      </ContextMenuTrigger>
    )

    const first = direction === 'incoming' ? downloadButton : menuButton
    const last = direction === 'incoming' ? menuButton : downloadButton

    return (
      <div
        className={classNames(
          'module-message__buttons',
          `module-message__buttons--${direction}`
        )}
      >
        {first}
        {replyButton}
        {last}
      </div>
    )
  }

  renderContextMenu (triggerId) {
    const {
      attachment,
      direction,
      status,
      onDelete,
      onDownload,
      onReply,
      onForward,
      onRetrySend,
      onShowDetail
    } = this.props
    const tx = window.translate

    const showRetry = status === 'error' && direction === 'outgoing'

    return (
      <ContextMenu id={triggerId}>
        <MenuItem
          attributes={{
            hidden: !this.state.textSelected
          }}
          onClick={_ => {
            navigator.clipboard.writeText(window.getSelection().toString())
          }}
        >
          {tx('menu_copy_to_clipboard')}
        </MenuItem>
        {attachment ? (
          <MenuItem
            onClick={onDownload}
          >
            {tx('download_attachment_desktop')}
          </MenuItem>
        ) : null}
        <MenuItem
          attributes={{
            className: 'module-message__context__reply'
          }}
          onClick={onReply}
        >
          {tx('reply_to_message_desktop')}
        </MenuItem>
        <MenuItem
          attributes={{
            className: 'module-message__context__forward'
          }}
          onClick={onForward}
        >
          {tx('menu_forward')}
        </MenuItem>
        <MenuItem
          attributes={{
            className: 'module-message__context__more-info'
          }}
          onClick={onShowDetail}
        >
          {tx('more_info_desktop')}
        </MenuItem>
        {showRetry ? (
          <MenuItem
            attributes={{
              className: 'module-message__context__retry-send'
            }}
            onClick={onRetrySend}
          >
            {tx('retry_send')}
          </MenuItem>
        ) : null}
        <MenuItem
          attributes={{
            className: 'module-message__context__delete-message'
          }}
          onClick={onDelete}
        >
          {tx('delete_message_desktop')}
        </MenuItem>
      </ContextMenu>
    )
  }

  render () {
    const {
      authorAddress,
      direction,
      id,
      timestamp,
      viewType,
      collapseMetadata,
      conversationType,
      message
    } = this.props

    // This id is what connects our triple-dot click with our associated pop-up menu.
    //   It needs to be unique.
    const triggerId = String(id || `${authorAddress}-${timestamp}`)

    return (
      <div
        onContextMenu={this.showMenu}
        className={classNames(
          'module-message',
          `module-message--${direction}`,
          { 'module-message--sticker': viewType === 23 }
        )}
      >
        {!collapseMetadata && conversationType === 'group' && direction === 'incoming' && Avatar(message)}
        {this.renderMenu(direction === 'outgoing', triggerId)}
        <div
          onContextMenu={this.showMenu}
          className={classNames(
            'module-message__container',
            `module-message__container--${direction}`
          )}
        >
          {direction === 'incoming' && conversationType === 'group' && Author(message)}
          {Attachment.render(this.props)}

          {this.renderText()}
          <MessageMetaData {...this.props} />
        </div>
        {this.renderMenu(direction === 'incoming', triggerId)}
        <div onClick={ev => { ev.stopPropagation() }}>
          {this.renderContextMenu(triggerId)}
        </div>
      </div>
    )
  }
}

module.exports = Message