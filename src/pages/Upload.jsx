import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext.jsx'

const Upload = () => {
  const { addListing, categories, language, translations } = useMarketplace()
  const t = translations[language]
  const navigate = useNavigate()
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [contact, setContact] = useState('60123456789')
  const [imageDataUrl, setImageDataUrl] = useState('')
  const [category, setCategory] = useState('')
  const [tagsInput, setTagsInput] = useState('')

  const onImageChange = (e) => {
    const f = e.target.files?.[0]
    setImageFile(f || null)
    if (f) setPreview(URL.createObjectURL(f))
    else setPreview('')
    if (f) {
      const reader = new FileReader()
      reader.onload = () => setImageDataUrl(reader.result)
      reader.readAsDataURL(f)
    } else {
      setImageDataUrl('')
    }
  }

  const submit = (e) => {
    e.preventDefault()
    if (!imageFile || !title || !price) return
    if (!category) {
      alert(language === 'zh' ? '请选择分类' : 'Please select a category')
      return
    }
    const tags = tagsInput.split(' ').map(s => s.trim()).filter(Boolean)
    const id = addListing({ title, price, imageFile, imageDataUrl, description, contact, category, tags })
    navigate(`/product/${id}`)
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-4">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-700">{language === 'zh' ? '图片' : 'Image'}</label>
          {preview ? (
            <img src={preview} alt="preview" className="w-full h-56 object-cover rounded-xl shadow-sm mt-2" />
          ) : (
            <div className="w-full h-40 bg-gray-100 rounded-xl mt-2 flex items-center justify-center text-gray-400 text-sm">{language === 'zh' ? '选择图片' : 'Select image'}</div>
          )}
          <input type="file" accept="image/*" onChange={onImageChange} className="mt-2 w-full text-sm" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">{language === 'zh' ? 'Tags / 标签 (用空格分隔)' : 'Tags (space separated)'}</label>
          <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder={language === 'zh' ? '#99新 #急出' : '#like-new #urgent'} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <div className="flex flex-wrap gap-2 mt-2">
            {[
              { en: 'Negotiable', zh: '可小刀' },
              { en: 'Urgent', zh: '急出' },
              { en: 'New', zh: '全新' },
              { en: 'Delivery', zh: '可邮寄' }
            ].map(p => (
              <button
                type="button"
                key={p.en}
                onClick={() => {
                  const toAdd = language === 'zh' ? p.zh : p.en
                  const parts = tagsInput.split(' ').filter(Boolean)
                  if (!parts.includes(toAdd)) {
                    setTagsInput([...(parts), toAdd].join(' '))
                  }
                }}
                className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs"
              >
                {language === 'zh' ? `${p.en}/${p.zh}` : `${p.en}/${p.zh}`}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-700">{language === 'zh' ? '标题' : 'Title'}</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder={language === 'zh' ? '如：Nike Dunk Low' : 'e.g., Nike Dunk Low'} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">{language === 'zh' ? '价格 (RM)' : `${t.price} (RM)`}</label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="例如：199" className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">{language === 'zh' ? '分类' : 'Category'}</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">{language === 'zh' ? '请选择分类' : 'Select a category'}</option>
            {categories.filter(c => c.key !== 'All').map(c => (
              <option key={c.key} value={c.key}>{language === 'zh' ? c.zh : c.en}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700">{t.description}</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder={language === 'zh' ? '简单描述一下商品情况' : 'Briefly describe the item'} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm text-gray-700">{language === 'zh' ? 'WhatsApp 号码' : 'WhatsApp Number'}</label>
          <input value={contact} onChange={e => setContact(e.target.value)} placeholder="60123456789" className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white rounded-full py-3 text-base font-medium shadow-sm">{t.sell}</button>
      </form>
    </div>
  )
}

export default Upload
