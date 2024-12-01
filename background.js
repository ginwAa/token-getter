// 存储结构示例:
// {
//   "https://host.com": {
//     "basePath": "https://host.com",
//     "paths": ["/A", "/BCD"]
//   }
// }

// 创建基本菜单结构
chrome.runtime.onInstalled.addListener(function() {
  // 创建父菜单
  chrome.contextMenus.create({
    id: "pathManager",
    title: "路径管理器",
    contexts: ["all"]
  });

  // 创建保存路径的子菜单
  chrome.contextMenus.create({
    id: "savePath",
    parentId: "pathManager",
    title: "保存当前路径",
    contexts: ["all"]
  });

  // 创建导航菜单
  chrome.contextMenus.create({
    id: "navigate",
    parentId: "pathManager",
    title: "快速导航",
    contexts: ["all"]
  });

  // 初始化更新菜单
  updateNavigationMenus();
});

// 解析URL函数
function parseUrl(url) {
  try {
    const urlObj = new URL(url);
    const basePath = `${urlObj.protocol}//${urlObj.hostname}`;
    const pathSuffix = urlObj.pathname === '/' ? '' : urlObj.pathname;
    return { basePath, pathSuffix };
  } catch (e) {
    return null;
  }
}

// 更新导航菜单
function updateNavigationMenus() {
  // 先移除所有导航相关的子菜单
  chrome.contextMenus.removeAll(function() {
    // 重建基本结构
    chrome.contextMenus.create({
      id: "pathManager",
      title: "路径管理器",
      contexts: ["all"]
    });

    chrome.contextMenus.create({
      id: "savePath",
      parentId: "pathManager",
      title: "保存当前路径",
      contexts: ["all"]
    });

    chrome.contextMenus.create({
      id: "navigate",
      parentId: "pathManager",
      title: "快速导航",
      contexts: ["all"]
    });

    // 获取当前活动标签的URL信息
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        const urlInfo = parseUrl(tabs[0].url);
        if (urlInfo) {
          // 获取存储的路径数据
          chrome.storage.local.get(urlInfo.basePath, function(items) {
            const pathData = items[urlInfo.basePath];
            if (pathData && pathData.paths.length > 0) {
              // 为每个保存的路径创建菜单项
              pathData.paths.forEach(path => {
                chrome.contextMenus.create({
                  id: `nav_${pathData.basePath}${path}`,
                  parentId: "navigate",
                  title: path || '(根路径)',
                  contexts: ["all"]
                });
              });
            }
          });
        }
      }
    });
  });
}

// 处理菜单点击事件
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === "savePath") {
    // 保存当前路径
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        const urlInfo = parseUrl(tabs[0].url);
        if (urlInfo) {
          chrome.storage.local.get(urlInfo.basePath, function(items) {
            let pathData = items[urlInfo.basePath] || {
              basePath: urlInfo.basePath,
              paths: []
            };
            
            // 检查是否已存在该路径
            if (!pathData.paths.includes(urlInfo.pathSuffix)) {
              pathData.paths.push(urlInfo.pathSuffix);
              // 保存更新后的数据
              const update = {};
              update[urlInfo.basePath] = pathData;
              chrome.storage.local.set(update, function() {
                alert(`已保存路径: ${urlInfo.pathSuffix || '(根路径)'}`);
                updateNavigationMenus();
              });
            } else {
              alert(`路径 ${urlInfo.pathSuffix || '(根路径)'} 已存在！`);
            }
          });
        }
      }
    });
  } else if (info.menuItemId.startsWith("nav_")) {
    // 处理导航请求
    const url = info.menuItemId.substring(4);
    chrome.tabs.create({ url: url });
  }
});

// 监听标签变化，更新菜单
chrome.tabs.onActivated.addListener(function() {
  updateNavigationMenus();
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete') {
    updateNavigationMenus();
  }
});