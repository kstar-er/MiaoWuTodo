/**
 * 图片加载工具函数
 */
import petConfig from '../assets/config/pet_config.ts'

/**
 * 读取指定目录下的所有图片
 * @param {string} directory - 目录路径，相对于src/assets
 * @returns {Object} - 图片名称到URL的映射对象
 */
export function loadImagesFromDirectory(directory) {
  const images = {};
  
  try {
    // 使用Vite的import.meta.glob动态导入图片
    const imageModules = import.meta.glob('/src/assets/**/*.{png,jpg,jpeg,gif,svg}', { eager: true });
    
    // 过滤指定目录下的图片
    const directoryPath = `/src/assets/${directory}/`;
    
    // 处理每个匹配的图片模块
    Object.entries(imageModules).forEach(([path, module]) => {
      if (path.startsWith(directoryPath)) {
        // 提取文件名 (不含扩展名)
        const fileName = path.substring(path.lastIndexOf('/') + 1).split('.')[0];
        // 存储图片URL
        images[fileName] = module.default;
      }
    });
    
    return images;
  } catch (error) {
    console.error(`加载图片目录失败: ${directory}`, error);
    return {};
  }
}

/**
 * 获取单个图片URL
 * @param {string} directory - 目录路径，相对于src/assets
 * @param {string} imageName - 图片名称(包含扩展名)
 * @returns {string|null} - 图片URL或null
 */
export function getImageUrl(directory, imageName) {
  try {
    // 使用新的路径格式
    return `/assets/media/${imageName}`;
  } catch (error) {
    console.error(`加载图片失败: ${directory}/${imageName}`, error);
    return null;
  }
}

/**
 * 预加载指定目录下的所有图片
 * @param {string} directory - 目录路径，相对于src/assets
 * @returns {Promise<Object>} - 图片名称到Image对象的映射
 */
export async function preloadImagesFromDirectory(directory) {
  const imageUrls = loadImagesFromDirectory(directory);
  const loadedImages = {};
  console.log(imageUrls);
  const loadPromises = Object.entries(imageUrls).map(([name, url]) => {
    return new Promise((resolve) => {
      let img = new Image();
      img.onload = () => {
        loadedImages[name] = { img, url };
        resolve();
      };
      img.onerror = () => {
        console.error(`Failed to load image: ${name}`);
        resolve();
      };
      img.src = url;
    });
  });

  await Promise.all(loadPromises);
  return loadedImages;
}

/**
 * 获取配置文件路径
 * @param {string} name - 配置文件名称（不含扩展名）
 * @returns {string} - 配置文件路径
 */
export function getConfigFilePath(name) {
  return `/src/assets/config/${name}.json`; // 使用小写名称以确保一致性
}

/**
 * 加载配置文件
 * @param {string} name - 配置文件名称（不含扩展名）
 * @returns {Promise<Object>} - 配置文件内容
 */
export async function loadConfigFile(name) {
  try {
    const configModules = import.meta.glob('/src/assets/config/*.json', { eager: true });
    const configPath = `/src/assets/config/${name}.json`;
    if (configModules[configPath]) {
      return configModules[configPath].default;
    }
    return {
      frameSize: 32,
      states: {
        idle: {
          spriteLine: 1,
          frameMax: 3
        }
      }
    };
  } catch (error) {
    console.error(`加载配置文件失败: ${name}`, error);
    // 返回默认配置
    return {
      frameSize: 32,
      states: {
        idle: {
          spriteLine: 1,
          frameMax: 3
        }
      }
    };
  }
}