<template>
  <div class="image-gallery">
    <h2>图片库</h2>
    
    <div class="directory-selector">
      <button 
        v-for="dir in availableDirectories" 
        :key="dir"
        @click="loadDirectory(dir)"
        :class="{ active: currentDirectory === dir }"
      >
        {{ dir }}
      </button>
    </div>
    
    <div v-if="loading" class="loading">
      加载中...
    </div>
    
    <div v-else-if="Object.keys(images).length === 0" class="no-images">
      没有找到图片
    </div>
    
    <div v-else class="gallery-grid">
      <div 
        v-for="(imageUrl, name) in images" 
        :key="name" 
        class="image-item"
      >
        <img :src="imageUrl" :alt="name" />
        <div class="image-name">{{ name }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { loadImagesFromDirectory } from '@/utils/imageLoader';

export default {
  name: 'ImageGallery',
  
  setup() {
    const availableDirectories = ref(['pet_image', 'test_image']);
    const currentDirectory = ref('');
    const images = ref({});
    const loading = ref(false);
    
    // 加载指定目录的图片
    const loadDirectory = async (directory) => {
      loading.value = true;
      currentDirectory.value = directory; 
      
      // 使用工具函数加载图片
      images.value = loadImagesFromDirectory(directory);
      
      loading.value = false;
    };
    
    // 组件挂载时加载默认目录
    onMounted(() => {
      loadDirectory(availableDirectories.value[0]);
    });
    
    return {
      availableDirectories,
      currentDirectory,
      images,
      loading,
      loadDirectory
    };
  }
};
</script>

<style scoped>
.image-gallery {
  padding: 20px;
}

.directory-selector {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.directory-selector button {
  padding: 8px 16px;
  border: 1px solid #ccc;
  background-color: #f5f5f5;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
}

.directory-selector button.active {
  background-color: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.image-item {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s;
}

.image-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.image-item img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
}

.image-name {
  padding: 10px;
  text-align: center;
  background-color: #f9f9f9;
  border-top: 1px solid #eee;
}

.loading, .no-images {
  text-align: center;
  padding: 40px;
  color: #666;
  font-style: italic;
}
</style>