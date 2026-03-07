/**
 * 图片压缩工具
 * 使用 Canvas API 在客户端压缩图片
 */

/**
 * 压缩图片
 * @param {File} file - 原始图片文件
 * @param {number} maxWidth - 最大宽度（默认 1200px）
 * @param {number} quality - 压缩质量 0-1（默认 0.8）
 * @returns {Promise<File>} - 压缩后的 File 对象
 */
export const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        // 文件类型白名单校验（防止 SVG 等危险格式绕过 accept 属性）
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
        if (!ALLOWED_TYPES.includes(file.type)) {
            reject(new Error(`Unsupported file type: ${file.type}. Only JPEG, PNG and WebP are allowed.`))
            return
        }

        // 5MB 硬限制（压缩前拒绝超大文件，防止移动端崩溃）
        const MAX_SIZE_BYTES = 5 * 1024 * 1024
        if (file.size > MAX_SIZE_BYTES) {
            reject(new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed size is 5MB.`))
            return
        }

        // 如果文件小于 500KB，不压缩
        if (file.size < 500 * 1024) {
            resolve(file)
            return
        }

        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = (e) => {
            const img = new Image()
            img.src = e.target.result
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let { width, height } = img

                // 按比例缩放
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width)
                    width = maxWidth
                }

                canvas.width = width
                canvas.height = height

                const ctx = canvas.getContext('2d')
                ctx.drawImage(img, 0, 0, width, height)

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            resolve(file) // 压缩失败时返回原文件
                            return
                        }
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        })

                        resolve(compressedFile)
                    },
                    'image/jpeg',
                    quality
                )
            }
            img.onerror = () => resolve(file) // 加载失败返回原文件
        }
        reader.onerror = () => resolve(file)
    })
}

/**
 * 批量压缩多个图片
 * @param {File[]} files - 图片文件数组
 * @returns {Promise<File[]>}
 */
export const compressImages = async (files) => {
    return Promise.all(files.map(f => compressImage(f)))
}
