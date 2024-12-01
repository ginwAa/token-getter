document.addEventListener('DOMContentLoaded', function() {
  const domainFilter = document.getElementById('domainFilter');
  const pathList = document.getElementById('pathList');
  const deleteDomainBtn = document.getElementById('deleteDomain');
  
  // 加载所有数据
  function loadData() {
    chrome.storage.local.get(null, function(items) {
      // 更新域名下拉框
      updateDomainFilter(items);
      // 显示路径列表
      updatePathList(items, domainFilter.value);
      // 更新删除域名按钮状态
      updateDeleteDomainButton();
    });
  }
  
  // 更新域名过滤器
  function updateDomainFilter(items) {
    // 保存当前选择
    const currentSelection = domainFilter.value;
    
    // 清除现有选项
    while (domainFilter.options.length > 1) {
      domainFilter.remove(1);
    }
    
    // 添加所有域名
    Object.keys(items).forEach(domain => {
      const option = new Option(domain, domain);
      domainFilter.add(option);
    });
    
    // 恢复选择（如果仍然存在）
    if (currentSelection && domainFilter.querySelector(`option[value="${currentSelection}"]`)) {
      domainFilter.value = currentSelection;
    }
  }
  
  // 更新路径列表
  function updatePathList(items, selectedDomain) {
    pathList.innerHTML = '';
    
    if (!selectedDomain) {
      pathList.innerHTML = '<div class="empty-message">请选择域名</div>';
      return;
    }
    
    const domainData = items[selectedDomain];
    if (!domainData || domainData.paths.length === 0) {
      pathList.innerHTML = '<div class="empty-message">该域名下暂无保存的路径</div>';
      return;
    }
    
    // 创建路径列表
    domainData.paths.forEach(path => {
      const item = document.createElement('div');
      item.className = 'path-item';
      
      const pathUrl = document.createElement('div');
      pathUrl.className = 'path-url';
      pathUrl.textContent = path || '(根路径)';
      pathUrl.title = domainData.basePath + path;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.textContent = '删除';
      deleteBtn.onclick = () => deletePath(selectedDomain, path);
      
      item.appendChild(pathUrl);
      item.appendChild(deleteBtn);
      pathList.appendChild(item);
      
      // 添加点击跳转功能
      pathUrl.style.cursor = 'pointer';
      pathUrl.onclick = () => {
        chrome.tabs.create({ url: domainData.basePath + path });
      };
    });
  }
  
  // 更新删除域名按钮状态
  function updateDeleteDomainButton() {
    deleteDomainBtn.disabled = !domainFilter.value;
  }
  
  // 删除路径
  function deletePath(domain, path) {
    if (confirm(`确定要删除路径 "${path || '(根路径)'}" 吗？`)) {
      chrome.storage.local.get(domain, function(items) {
        const domainData = items[domain];
        if (domainData) {
          // 移除路径
          domainData.paths = domainData.paths.filter(p => p !== path);
          
          // 如果没有路径了，则删除整个域名数据
          if (domainData.paths.length === 0) {
            chrome.storage.local.remove(domain, function() {
              loadData();
            });
          } else {
            // 否则更新路径列表
            const update = {};
            update[domain] = domainData;
            chrome.storage.local.set(update, function() {
              loadData();
            });
          }
        }
      });
    }
  }
  
  // 删除整个域名数据
  function deleteDomain(domain) {
    if (confirm(`确定要删除域名 "${domain}" 下的所有数据吗？`)) {
      chrome.storage.local.remove(domain, function() {
        loadData();
      });
    }
  }
  
  // 监听域名选择变化
  domainFilter.addEventListener('change', function() {
    chrome.storage.local.get(null, function(items) {
      updatePathList(items, domainFilter.value);
      updateDeleteDomainButton();
    });
  });
  
  // 监听删除域名按钮点击
  deleteDomainBtn.addEventListener('click', function() {
    if (domainFilter.value) {
      deleteDomain(domainFilter.value);
    }
  });
  
  // 初始加载数据
  loadData();
});