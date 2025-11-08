<template>
  <div ref="cesiumContainer" class="cesium-container">
    <div
      v-if="tooltip.visible"
      class="cesium-tooltip"
      :style="{ left: tooltip.x, top: tooltip.y }"
      v-html="tooltip.content"
    ></div>
  </div>
</template>

<script setup>
// 【新增】导入 onUnmounted
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import * as Cesium from 'cesium'

// 1. 定义 Props
const props = defineProps({
  selectedMetric: {
    type: String,
    required: true,
  },
  provincialData: {
    type: Array,
    required: true,
  },
  // 【新增】接收来自 Page4 的省份名称映射
  provinceNameMap: {
    type: Object,
    required: true,
  },
})

// 2. 设置 Cesium 容器的 ref
const cesiumContainer = ref(null)
const viewerRef = ref(null) 
const chinaDataSourceRef = ref(null)

// 【新增】为悬浮提示框创建 ref
const tooltip = ref({
  visible: false,
  x: '0px',
  y: '0px',
  content: '', // 提示框的 HTML 内容
})

// 3. 【核心】处理数据 (不变)
const dataForHeatmap = computed(() => {
  const metric = props.selectedMetric
  
  const data2023 = props.provincialData
    .filter((d) => d.year === '2023' && d[metric] !== null)
    .map((d) => ({
      name: d.province, // 省份简称
      value: d[metric],
    }))

  const values = data2023.map((d) => d.value)
  const min = values.length > 0 ? Math.min(...values) : 0
  const max = values.length > 0 ? Math.max(...values) : 0

  const dataMap = new Map()
  data2023.forEach((d) => {
    dataMap.set(d.name, { value: d.value })
  })

  return { dataMap, min, max }
})

// 4. 【核心】颜色计算函数 (不变)
const HEATMAP_COLORS = [
  Cesium.Color.fromCssColorString('#1e3a8a'),
  Cesium.Color.fromCssColorString('#38bdf8'),
  Cesium.Color.fromCssColorString('#facc15'),
  Cesium.Color.fromCssColorString('#f87171'),
]

function getColorForValue(value, min, max) {
  if (value === null || value === undefined) {
    return Cesium.Color.GRAY.withAlpha(0.5)
  }
  const range = max - min
  if (range === 0) {
    return HEATMAP_COLORS[Math.floor(HEATMAP_COLORS.length / 2)] 
  }
  const percent = (value - min) / range
  if (percent <= 0) return HEATMAP_COLORS[0]
  if (percent >= 1) return HEATMAP_COLORS[HEATMAP_COLORS.length - 1]
  const colorIndex = (HEATMAP_COLORS.length - 1) * percent
  const lowIndex = Math.floor(colorIndex)
  const highIndex = Math.ceil(colorIndex)
  const lerpPercent = colorIndex - lowIndex
  if (lowIndex === highIndex) {
    return HEATMAP_COLORS[lowIndex]
  }
  return Cesium.Color.lerp(
    HEATMAP_COLORS[lowIndex],
    HEATMAP_COLORS[highIndex],
    lerpPercent,
    new Cesium.Color()
  )
}

// 5. 【核心】应用热力图样式 (不变, 之前的修复已包含)
function applyHeatmapStyle() {
  const dataSource = chinaDataSourceRef.value
  const { dataMap, min, max } = dataForHeatmap.value
  const viewer = viewerRef.value 

  if (!dataSource || !viewer) { 
    return
  }
  
  const entities = dataSource.entities.values
  const currentTime = viewer.clock.currentTime 

  for (const entity of entities) {
    const properties = entity.properties
    if (!properties || !properties.name) {
      continue;
    }

    const fullName = properties.name.getValue(currentTime) 
    if (!fullName) continue;

    // 逻辑 A: "北京市" -> "北京"
    const shortName = fullName
      .replace(/省|市|自治区|回族|维吾尔/g, '')
      .replace('内蒙古', '内蒙')
      .replace('黑龙江', '黑龙江');
    
    // 逻辑 B: 使用 "北京" 查找数据
    const dataEntry = dataMap.get(shortName)
    const value = dataEntry ? dataEntry.value : null
    
    // 逻辑 C: 计算颜色
    const color = getColorForValue(value, min, max)

    entity.polygon.material = color
    entity.polygon.outline = true
    entity.polygon.outlineColor = Cesium.Color.WHITE.withAlpha(0.5)
    entity.polygon.outlineWidth = 1.5

    // 【【【修改】】】
    // 我们不再需要设置 entity.description, 因为我们将使用悬浮提示框
    // entity.description = ... (这行被移除了)
  }
}

// 【新增】设置鼠标悬停交互的函数
function setupHoverTooltip(viewer) {
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
  
  handler.setInputAction((movement) => {
    // 1. 拾取鼠标位置的实体
    const pickedObject = viewer.scene.pick(movement.endPosition)

    // 2. 检查是否是我们想要的省份实体
    if (Cesium.defined(pickedObject) && pickedObject.id instanceof Cesium.Entity && pickedObject.id.polygon) {
      const entity = pickedObject.id
      const properties = entity.properties
      const currentTime = viewer.clock.currentTime

      if (!properties || !properties.name) {
        tooltip.value.visible = false
        return
      }

      // 3. 获取数据 (与 applyHeatmapStyle 中的逻辑一致)
      const fullName = properties.name.getValue(currentTime)
      const shortName = fullName
        .replace(/省|市|自治区|回族|维吾尔/g, '')
        .replace('内蒙古', '内蒙')
        .replace('黑龙江', '黑龙江');
      
      // 3a. 【新增】从 Prop 获取原始全称 (例如 "内蒙古自治区")
      const originalFullName = props.provinceNameMap[shortName] || fullName;
      
      // 3b. 获取指标数据
      const dataEntry = dataForHeatmap.value.dataMap.get(shortName)
      const value = dataEntry ? dataEntry.value : null
      const formattedValue = (value === null) ? 'N/A' : value.toLocaleString()

      // 4. 构建提示框的 HTML 内容
      const content = `
        <div class="tooltip-content">
          <h3>${originalFullName}</h3>
          <strong>${props.selectedMetric} (2023):</strong><br>
          <span>${formattedValue}</span>
        </div>
      `
      
      // 5. 更新 tooltip 的状态 (显示、内容和位置)
      tooltip.value = {
        visible: true,
        content: content,
        x: `${movement.endPosition.x}px`,
        y: `${movement.endPosition.y}px`,
      }
      
    } else {
      // 6. 如果鼠标没有悬停在任何省份上, 隐藏提示框
      tooltip.value.visible = false
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE) // 监听 MOUSE_MOVE (鼠标移动) 事件
  
  return handler // 返回 handler 以便后续销毁
}

// 【新增】在组件销毁时, 清理事件监听器
let tooltipHandler = null
onUnmounted(() => {
  if (tooltipHandler) {
    tooltipHandler.destroy()
  }
})

// 6. Cesium 初始化
onMounted(async () => {
  if (cesiumContainer.value) {
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYzk2MGI3Ni1lZjk5LTRmMWUtODY0ZC1lZTA1NDNjMzdiYmUiLCJpZCI6MzU3NjYwLCJpYXQiOjE3NjI0MDEzNjZ9.OlRiI2WQJi2HxSiB0Xv_UHTW2AhVFHAFycbVMS9W_18' 

    const viewer = new Cesium.Viewer(cesiumContainer.value, {
      animation: false, 
      baseLayerPicker: false,
      fullscreenButton: false, 
      geocoder: false, 
      homeButton: false, 
      // 【修改】我们使用自定义提示框, 所以保持 InfoBox 关闭
      infoBox: false, 
      sceneModePicker: false, 
      selectionIndicator: false, 
      timeline: false, 
      navigationHelpButton: false, 
      terrainProvider: await Cesium.createWorldTerrainAsync(), 
    })

    viewer.scene.globe.enableLighting = true
    viewerRef.value = viewer 

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(104.0, 36.0, 5000000.0),
    })

    try {
      const dataSource = await Cesium.GeoJsonDataSource.load('/map/china.json', {
        stroke: Cesium.Color.WHITE,
        strokeWidth: 2,
        fill: Cesium.Color.GRAY.withAlpha(0.5), 
      })
      
      await viewer.dataSources.add(dataSource)
      chinaDataSourceRef.value = dataSource

      applyHeatmapStyle()
      
      // 【新增】初始化悬停事件
      tooltipHandler = setupHoverTooltip(viewer)

    } catch (error) {
      console.error('加载 china.json 失败:', error)
    }
  }
})

// 7. 【核心】侦听指标变化 (不变)
watch(() => props.selectedMetric, () => {
  if (chinaDataSourceRef.value && viewerRef.value) {
    applyHeatmapStyle()
  }
})
</script>

<style scoped>
.cesium-container {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  /* 【新增】确保 tooltip 可以正确定位 */
  position: relative;
}

:deep(.cesium-viewer-bottom) {
  display: none !important;
}

/* 【【【新增】】】 悬浮提示框的样式 */
.cesium-tooltip {
  position: absolute;
  z-index: 100; /* 确保在最上层 */
  
  /* 样式 */
  background: rgba(0, 0, 0, 0.75);
  border: 1px solid #444;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  
  /* 交互 */
  pointer-events: none; /* 让鼠标可以穿透, 否则会挡住 Cesium */
  transform: translate(10px, 10px); /* 偏移, 避免挡住鼠标指针 */
  white-space: nowrap; /* 防止标题换行 */
  
  transition: opacity 0.1s;
}

/* 【新增】使用 :deep() 来设置 v-html 内部的样式 
*/
:deep(.tooltip-content h3) {
  margin: 0 0 5px 0;
  font-size: 1.1rem;
  color: #fff;
  font-weight: 600;
}

:deep(.tooltip-content strong) {
  color: #ccc; /* 标签使用浅灰色 */
  font-weight: 400;
}

:deep(.tooltip-content span) {
  font-size: 1.1em;
  color: #facc15; /* 数据使用高亮黄色 */
  font-weight: bold;
}
</style>