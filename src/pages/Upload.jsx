import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext.jsx'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'

const Upload = () => {
  const { addListing, categories, language, translations, addLocation, locations, normalize } = useMarketplace()
  const t = translations[language]
  const navigate = useNavigate()
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [wechat, setWechat] = useState('')
  const [instagram, setInstagram] = useState('')
  const [imageDataUrl, setImageDataUrl] = useState('')
  const [category, setCategory] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [locationName, setLocationName] = useState('')
  const [latlng, setLatlng] = useState({ lat: 3.119, lng: 101.654 }) // UM 区域默认

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
    if (!imageFile) { alert(language === 'zh' ? '请上传图片' : 'Please upload an image'); return }
    if (!title.trim()) { alert(language === 'zh' ? '标题不能为空' : 'Title is required'); return }
    if (!String(price).trim()) { alert(language === 'zh' ? '价格不能为空' : 'Price is required'); return }
    if (!category) {
      alert(language === 'zh' ? '请选择分类' : 'Please select a category')
      return
    }
    if (!locationName.trim()) {
      alert(language === 'zh' ? '请输入地点名称' : 'Please enter location name')
      return
    }
    if (!whatsapp && !wechat && !instagram) {
      alert(language === 'zh' ? '必须填写至少一种联系方式！' : 'At least one contact method is required!')
      return
    }

    // 智能修正地点名称
    let finalLocationName = locationName.trim()
    const normalizedInput = normalize(finalLocationName)
    const existingMatch = locations.find(loc => normalize(loc) === normalizedInput)
    if (existingMatch) {
      finalLocationName = existingMatch
    }

    const tags = tagsInput.split(' ').map(s => s.trim()).filter(Boolean)
    const id = addListing({
      title,
      price,
      imageFile,
      imageDataUrl,
      description,
      whatsapp,
      wechat,
      instagram,
      locationName: finalLocationName,
      lat: latlng?.lat,
      lng: latlng?.lng,
      category,
      tags
    })
    addLocation(finalLocationName)
    navigate(`/product/${id}`)
  }

  const ClickPicker = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng
        setLatlng({ lat, lng })
        if (!locationName.trim()) setLocationName('Custom Pin')
      }
    })
    return null
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
          <label className="block text-sm text-gray-700">{language === 'zh' ? '地点名称' : 'Location Name'}</label>
          <input 
            value={locationName} 
            onChange={e => setLocationName(e.target.value)} 
            placeholder={language === 'zh' ? '如：South Link, UM Library' : 'e.g., South Link, UM Library'} 
            list="location-suggestions"
            className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" 
          />
          <datalist id="location-suggestions">
            {locations.map((loc, index) => (
              <option key={index} value={loc} />
            ))}
          </datalist>
          <div className="mt-3 rounded-xl overflow-hidden">
            <MapContainer center={[latlng.lat, latlng.lng]} zoom={15} style={{ height: 240 }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[latlng.lat, latlng.lng]} />
              <ClickPicker />
            </MapContainer>
            <div className="mt-2 text-xs text-gray-600">{language === 'zh' ? `坐标：${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}（点击地图可选点）` : `Coords: ${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)} (click map to pick)`}</div>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-700">{t.description}</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder={language === 'zh' ? '简单描述一下商品情况' : 'Briefly describe the item'} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-sm text-gray-700">{language === 'zh' ? 'WhatsApp 号码' : 'WhatsApp Number'}</label>
            <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="60123456789" className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">{language === 'zh' ? '微信号' : 'WeChat ID'}</label>
            <input value={wechat} onChange={e => setWechat(e.target.value)} placeholder={language === 'zh' ? '如：miho_2025' : 'e.g., miho_2025'} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-700">Instagram</label>
            <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder={language === 'zh' ? '如：ryan_miho' : 'e.g., ryan_miho'} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white rounded-full py-3 text-base font-medium shadow-sm">{t.sell}</button>
      </form>
    </div>
  )
}

export default Upload
