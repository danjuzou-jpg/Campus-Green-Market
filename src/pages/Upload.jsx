import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMarketplace } from '../context/MarketplaceContext.jsx'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { compressImage } from '../lib/imageUtils.js'
import { LoadingButton } from '../components/LoadingSpinner.jsx'

const Upload = () => {
  const { addListing, categories, language, translations, addLocation, locations, normalize, showToast } = useMarketplace()
  const t = translations[language]
  const navigate = useNavigate()
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('MYR')
  const currencySymbols = { MYR: 'RM', CNY: '¥' }

  const [description, setDescription] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [wechat, setWechat] = useState('')
  const [instagram, setInstagram] = useState('')
  const [category, setCategory] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [locationName, setLocationName] = useState('')
  const [latlng, setLatlng] = useState({ lat: 3.119, lng: 101.654 })

  const onImageChange = async (e) => {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 9) {
      showToast('warning', t.maxImages)
      return
    }
    // 压缩图片
    const compressed = []
    for (const f of files) {
      const c = await compressImage(f)
      compressed.push(c)
    }
    const newImages = [...images, ...compressed]
    setImages(newImages)
    // 使用压缩后的文件生成预览，与实际上传一致
    const newPreviews = compressed.map(f => URL.createObjectURL(f))
    setPreviews([...previews, ...newPreviews])
  }

  const removeImage = (index) => {
    const newImages = [...images]; newImages.splice(index, 1); setImages(newImages)
    const newPreviews = [...previews]; URL.revokeObjectURL(newPreviews[index]); newPreviews.splice(index, 1); setPreviews(newPreviews)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (images.length === 0) { showToast('warning', t.maxImages.replace('9', '1')); return }
    if (!title.trim()) { showToast('warning', t.titleRequired); return }
    if (!String(price).trim()) { showToast('warning', t.priceRequired); return }
    if (!category) { showToast('warning', t.categoryRequired); return }
    if (!locationName.trim()) { showToast('warning', t.locationRequired); return }
    if (!whatsapp && !wechat && !instagram) { showToast('warning', t.contactRequired); return }

    let finalLocationName = locationName.trim()
    const normalizedInput = normalize(finalLocationName)
    const existingMatch = locations.find(loc => normalize(loc) === normalizedInput)
    if (existingMatch) finalLocationName = existingMatch

    const tags = tagsInput.split(' ').map(s => s.trim()).filter(Boolean)

    try {
      setSubmitting(true)
      const id = await addListing({
        title, price, images, description, whatsapp, wechat, instagram,
        locationName: finalLocationName, lat: latlng?.lat, lng: latlng?.lng, category, tags, currency
      })
      if (id) {
        addLocation(finalLocationName)
        navigate(`/product/${id}`)
      }
    } catch (err) {
      console.error('Unexpected error in Upload submit:', err)
      showToast('error', t.publishFailed)
    } finally {
      setSubmitting(false)
    }
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

  const quickTags = [
    { key: 'tagNegotiable' },
    { key: 'tagUrgent' },
    { key: 'tagNew' },
    { key: 'tagDelivery' }
  ]

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-24">
      <h1 className="text-2xl font-black text-gray-900 mb-6">{t.sellItem}</h1>

      <form onSubmit={submit} className="space-y-6">
        {/* Images */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t.productImages}</label>
          <div className="grid grid-cols-3 gap-3">
            {previews.map((url, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 shadow-sm group bg-gray-50">
                <img src={url} alt="preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors">
                  <div className="text-[10px]">✕</div>
                </button>
              </div>
            ))}
            {images.length < 9 && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all group">
                <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center mb-2 transition-colors">
                  <span className="text-xl leading-none mb-0.5">+</span>
                </div>
                <div className="text-[10px] font-bold">{t.addPhoto}</div>
                <input type="file" accept="image/*" multiple onChange={onImageChange} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">{t.title}</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder={t.titlePlaceholder} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-medium" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">{t.price}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{currencySymbols[currency]}</span>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-bold text-emerald-600" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">{t.currency}</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none font-medium text-gray-700">
                <option value="MYR">{t.currencyMYR}</option>
                <option value="CNY">{t.currencyCNY}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">{t.category}</label>
            <div className="relative">
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none font-medium text-gray-700">
                <option value="">{t.selectCategory}</option>
                {categories.filter(c => c.key !== 'All').map(c => (
                  <option key={c.key} value={c.key}>{language === 'zh' ? c.zh : c.en}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">{t.descriptionLabel}</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder={t.descPlaceholder} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">{t.tags}</label>
            <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder={language === 'zh' ? '#99新 #急出' : '#like-new #urgent'} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" />
            <div className="flex flex-wrap gap-2 mt-2 px-1">
              {quickTags.map(p => (
                <button type="button" key={p.key} onClick={() => {
                  const toAdd = t[p.key]
                  const parts = tagsInput.split(' ').filter(Boolean)
                  if (!parts.includes(toAdd)) setTagsInput([...parts, toAdd].join(' '))
                }} className="px-3 py-1 rounded-full bg-gray-100 hover:bg-emerald-50 hover:text-emerald-600 text-gray-600 text-[10px] font-bold transition-colors">
                  + {t[p.key]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{t.location}</label>
          <input value={locationName} onChange={e => setLocationName(e.target.value)} placeholder={t.locationPlaceholder} list="location-suggestions" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" />
          <datalist id="location-suggestions">
            {locations.map((loc, index) => (<option key={index} value={loc} />))}
          </datalist>
          <div className="h-48 w-full rounded-xl overflow-hidden shadow-inner relative z-0">
            <MapContainer center={latlng} zoom={15} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' />
              <Marker position={latlng} />
              <ClickPicker />
            </MapContainer>
            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-gray-500 z-[400] pointer-events-none border border-gray-100">
              {t.tapToPickLocation}
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50 space-y-4">
          <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider">{t.contactMethods}</label>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
              </div>
              <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="WhatsApp Number" className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              </div>
              <input value={wechat} onChange={e => setWechat(e.target.value)} placeholder="WeChat ID" className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
              </div>
              <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="Instagram Handle" className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
          </div>
        </div>

        <LoadingButton
          type="submit"
          loading={submitting}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-full shadow-lg shadow-emerald-200 active:scale-95 transition-all text-sm uppercase tracking-widest mt-8"
        >
          {t.listItem}
        </LoadingButton>
      </form>
    </div>
  )
}

export default Upload
