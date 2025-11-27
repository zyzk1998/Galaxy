# Galaxy Agent 知识库 (constants.ts) 填充指南

本项目采用 **Client-Side RAG** 模式。`constants.ts` 是智能体的“大脑皮层”，连接了用户的自然语言意图与 Galaxy 的严格 API 参数。

你必须根据你的 Galaxy 服务器实际安装的工具，更新 `AVAILABLE_TOOLS` 列表。

## 第一步：找到工具的真实 ID (Tool ID)

LLM 不需要知道复杂的 ID，但代码需要。

1. **通过浏览器查找**：
   - 打开你的 Galaxy 网页。
   - 在左侧工具栏找到你想调用的工具（例如 `grep` 或 `Filter`）。
   - 右键点击工具名，选择“复制链接地址”。
   - 链接通常长这样：`.../tool_runner?tool_id=Filter1`。
   - `tool_id=` 后面的部分就是真实 ID（例如 `Filter1` 或 `toolshed.g2.bx.psu.edu/repos/...`）。

2. **通过 API 查找** (推荐)：
   - 访问 `http://192.168.32.31/api/tools`。
   - 搜索工具名（Ctrl+F），找到 `id` 字段。

## 第二步：找到工具的输入参数名 (Argument Names)

Galaxy 的 UI 显示名称（Label）和 API 实际参数名（Name）往往不同。

1. **方法**：
   - 在 Galaxy 网页中打开该工具。
   - 随便填写一些参数。
   - 点击底部的 "Run Tool" 按钮。
   - 点击右侧历史记录中生成的任务（即使失败也可以），点击 "i" (View Details) 图标。
   - 在 "Tool Parameters" 或 "Command Line" 部分，观察实际传递的参数名。
   - 或者使用 API: `http://192.168.32.31/api/tools/{tool_id}` 查看详细定义。

## 第三步：更新 constants.ts

找到 `mapping` 字段并进行修改：

```typescript
{
  name: 'text_filter', // 给 LLM 看的名字
  // ... parameters ...
  mapping: {
    // 【修改这里】填入第一步获取的真实 ID
    toolId: 'toolshed.g2.bx.psu.edu/repos/devteam/grep/grep/1.0.1', 
    
    params: {
      // 左边是 LLM 理解的参数名 : 右边是 Galaxy 真实的参数名
      'dataset_id': { galaxyName: 'input', type: 'hda_ref' }, 
      'pattern': 'pattern', // 如果 Galaxy API 里叫 'pattern'
      'invert': { galaxyName: 'invert', type: 'boolean_to_string' }
    }
  }
}
```

## 常见参数类型处理

- **输入文件**: 必须使用 `{ galaxyName: 'input_name', type: 'hda_ref' }`。
- **布尔值**: Galaxy 通常接受 "true"/"false" 字符串而不是布尔值，使用 `{ ..., type: 'boolean_to_string' }`。
- **普通字符串/数字**: 直接写字符串映射，例如 `'lines': 'line_count'`。
