<template>
  <div class="pet-management">
    <div class="header">
      <el-button type="primary" @click="handleAddPet">新增宠物</el-button>
    </div>

    <div class="pet-grid">
      <el-card v-for="(pet, index) in pets" :key="index" class="pet-card">
        <div class="pet-preview">
          <img :src="pet.imagePath" :alt="pet.name" class="pet-image" />
        </div>
        <div class="pet-info">
          <h3>{{ pet.name }}</h3>
          <div class="pet-actions">
            <el-button type="primary" size="small" @click="selectPet(pet)">选择</el-button>
            <el-button type="danger" size="small" @click="deletePet(index)">删除</el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 文件选择对话框 -->
    <input type="file" ref="fileInput" style="display: none" accept="image/*" @change="handleFileSelected" />
    <canvas id="canvas" style="display:none;"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { readDir, copyFile, exists, create, BaseDirectory } from '@tauri-apps/plugin-fs';
import { open } from '@tauri-apps/plugin-dialog';
import { ElMessage } from 'element-plus';
import { getCurrentWindow, getAllWindows } from '@tauri-apps/api/window';
import { join, basename } from '@tauri-apps/api/path';
import { preloadImagesFromDirectory, loadConfigFile } from '../../utils/imageLoader';
import { createWinPetWin } from "../../multiwins/action"

var pets = ref([]);
// 初始化时加载宠物列表
onMounted(async () => {
  await loadPets();

});
async function loadPets() {
  try {
    // 从assets/media目录预加载所有宠物图片

    const petImagesObj = await preloadImagesFromDirectory('media');

    // 转换预加载的图片对象为宠物数据数组
    pets.value = await Promise.all(Object.entries(petImagesObj).map(async ([fileName]) => {
      const pet = {
        name: fileName, // 不带扩展名的文件名作为宠物名称
        imagePath: petImagesObj[fileName].img.src, // Image对象的src属性包含图片URL
        fileName: fileName, // 保存完整文件名
        image: petImagesObj[fileName].img,
        sourceUrl: petImagesObj[fileName].url
      };

      // 尝试加载配置文件
      return pet;
    }));

    console.log('转换后的宠物数据:', pets.value);

    if (pets.value.length === 0) {
      console.warn('没有找到任何宠物图片');
    }
  }
  catch (error) {
    console.error('加载宠物失败:', error);
    ElMessage.error('加载宠物列表失败');
  }
  await updateFrames()
}
// 选择宠物
async function selectPet(pet) {
  try {
    // 更新当前选中的宠物
    console.log("选择宠物:", pet)
    localStorage.setItem('selectedPet', pet.sourceUrl);
    localStorage.setItem('selectedPetName', pet.name);
    ElMessage.success(`已选择宠物：${pet.name}`);
    // 传送参数到pet窗口
    const petWindows = await getAllWindows();
    const petWindow = petWindows.find(win => win.label === 'pet');

    if (petWindow) {
      // 关闭现有宠物窗口
      await petWindow.close();
      await createWinPetWin();
    }
  } catch (error) {
    console.error('切换宠物失败:', error);
    ElMessage.error('切换宠物失败');
  }
}

// 处理新增宠物
async function handleAddPet() {
  try {
    // 确保目标目录存在
    // 打开文件选择对话框
    const selected = await open({
      multiple: false,
      filters: [{
        name: 'Images',
        extensions: ['png', 'jpg', 'jpeg', 'gif']
      }]
    });

    if (selected) {
      // 获取文件名
      const fileName = await basename(selected);
      console.log('Selected file:', selected, 'File name:', fileName)
      // 复制文件到应用数据目录的pets文件夹
      await copyFile(fileName, fileName, { fromPathBaseDir: BaseDirectory.Desktop, toPathBaseDir: BaseDirectory.AppData });

      // 重新加载宠物列表
      await loadPets();
      ElMessage.success('宠物添加成功');
    }
  } catch (error) {
    console.error('Failed to add pet:', error);
    ElMessage.error('添加宠物失败');
  }
}

// 删除宠物
async function deletePet(index) {
  try {
    const pet = pets.value[index];
    // 从应用数据目录删除文件
    // await removeFile(`pets/${pet.fileName}`, { dir: BaseDirectory.App });
    pets.value.splice(index, 1);

    // 如果是当前选中的宠物，清除选择
    const selectedPet = JSON.parse(localStorage.getItem('selectedPet') || '{}');
    if (selectedPet.name === pet.name) {
      localStorage.removeItem('selectedPet');
    }

    ElMessage.success('宠物删除成功');
  } catch (error) {
    console.error('Failed to delete pet:', error);
    ElMessage.error('删除宠物失败');
  }
}
// 循环更新图片的帧
async function updateFrames() {
  for (let i = 0; i < pets.value.length; i++) {
    await updateFrame(i);
  }
}


let frameUpdateInterval;
function startFrameUpdate(index) {
  if (frameUpdateInterval) {
    clearInterval(frameUpdateInterval);
  }

  frameUpdateInterval = setInterval(async () => {
    await updateFrames();
  }, 3000); // 设置每秒更新一次
}

// 更新图片的帧
async function updateFrame(index) {
  const image = pets.value[index];
  const name = image.name;
  const config = await loadConfigFile(name);
  loadPetFrame(image, config);
}

// 通过config定位到对应帧的位置
function loadPetFrame(image, config) {
  let frameSize = config.frameSize;
  let stats = config.states;
  let length = Object.keys(stats).length;
  let lineIndex = 0;

  function updateFrameIndex() {
    lineIndex = (lineIndex + 1) % length;
    maxFrames = stats[Object.keys(stats)[lineIndex]].frameMax;
    spriteLine = stats[Object.keys(stats)[lineIndex]].spriteLine;
  }

  function drawFrame(frameIndex) {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = frameSize;
    canvas.height = frameSize;
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 清除画布
    ctx.drawImage(image.image, frameSize * frameIndex, (spriteLine - 1) * frameSize, frameSize, frameSize, 0, 0, frameSize, frameSize);
    image.imagePath = canvas.toDataURL();
  }

  let frameIndex = 0;
  let spriteLine = stats[Object.keys(stats)[lineIndex]].spriteLine;
  let maxFrames = stats[Object.keys(stats)[lineIndex]].frameMax;

  function updateFrameLoop() {
    drawFrame(frameIndex);
    frameIndex = (frameIndex + 1) % maxFrames;
    if (frameIndex === 0) {
      updateFrameIndex();
    }
  }

  updateFrameLoop(); // 初始调用一次
  setInterval(updateFrameLoop, 200); // 每100毫秒更新一次帧
}
</script>


<style scoped>
.pet-management {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    font-family: 'Ghibli', sans-serif;
    color: #8b4513;
    margin: 0;
    font-size: 24px;
    letter-spacing: 2px;
  }

  .el-button {
    height: 36px;
    border-radius: 10px;
    background: #8b4513;
    border: none;
    transition: all 0.3s ease;
    font-family: 'Ghibli', sans-serif;
    letter-spacing: 2px;
    position: relative;
    overflow: hidden;
    color: #f5f5f5;
    padding: 0 20px;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg,
          transparent,
          rgba(255, 255, 255, 0.2),
          transparent);
      transition: 0.5s;
    }

    &:hover::before {
      left: 100%;
    }

    &:hover {
      background: #a0522d;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(139, 69, 19, 0.2);
    }
  }
}

.pet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  padding: 20px;
}

.pet-card {
  transition: transform 0.3s;
  border-radius: 10px;
  overflow: hidden;
  background: #f5f5f5;
  border: 1px solid #d4b895;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 12px rgba(139, 69, 19, 0.1);
  }
}

.pet-preview {
  width: 100%;
  height: 200px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}

.pet-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.pet-info {
  padding: 15px;
  text-align: center;

  h3 {
    margin: 0 0 15px 0;
    font-family: 'Ghibli', sans-serif;
    color: #8b4513;
    font-size: 18px;
    letter-spacing: 1px;
  }
}

.pet-actions {
  display: flex;
  justify-content: center;
  gap: 10px;

  .el-button {
    height: 36px;
    border-radius: 10px;
    background: #8b4513;
    border: none;
    transition: all 0.3s ease;
    font-family: 'Ghibli', sans-serif;
    letter-spacing: 2px;
    position: relative;
    overflow: hidden;
    color: #f5f5f5;
    padding: 0 20px;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg,
          transparent,
          rgba(255, 255, 255, 0.2),
          transparent);
      transition: 0.5s;
    }

    &:hover::before {
      left: 100%;
    }

    &:hover {
      background: #a0522d;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(139, 69, 19, 0.2);
    }

    &.el-button--danger {
      background: #f5f5f5;
      color: #ff4757;
      border: 1px solid #ff4757;

      &:hover {
        background: #fff5f5;
        border-color: #ff6b6b;
      }
    }
  }
}
</style>