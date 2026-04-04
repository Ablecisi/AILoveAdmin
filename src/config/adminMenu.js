/**
 * 侧边栏菜单定义（顺序可被「外观与菜单」调整；name 与路由 name 一致）
 */
export const ADMIN_MENU_DEFS = [
  { name: 'dashboard', path: '/', icon: 'Odometer', defaultTitle: '驾驶舱' },
  { name: 'users', path: '/users', icon: 'User', defaultTitle: '用户管理' },
  { name: 'characters', path: '/characters', icon: 'Avatar', defaultTitle: 'AI 角色' },
  { name: 'articles', path: '/articles', icon: 'Document', defaultTitle: '文章运营' },
  { name: 'comments', path: '/comments', icon: 'ChatDotRound', defaultTitle: '评论管理' },
  { name: 'dialogs', path: '/dialogs', icon: 'ChatLineRound', defaultTitle: '会话与消息' },
  { name: 'prompts', path: '/prompts', icon: 'Memo', defaultTitle: 'Prompt 模板' },
  { name: 'data-maintenance', path: '/data-maintenance', icon: 'Files', defaultTitle: '数据维护' },
  { name: 'appearance', path: '/appearance', icon: 'Brush', defaultTitle: '外观与菜单' },
  { name: 'app-config', path: '/app-config', icon: 'Setting', defaultTitle: 'App 配置' },
]

export const ADMIN_MENU_BY_NAME = Object.fromEntries(ADMIN_MENU_DEFS.map((d) => [d.name, d]))
