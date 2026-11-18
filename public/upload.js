import { supabase } from './supabase.js'
console.log("j")
const imageInput = document.getElementById('imageInput')
const uploadBtn = document.getElementById('uploadBtn')

uploadBtn.addEventListener('click', async () => {

    const file = imageInput.files[0]

    if (!file) {
        alert('Вибери фотографію!')
        return
    }

    const { data, error } = await supabase
        .storage
        .from('product')
        .upload(file.name, file)

    if (error) {
        console.error(error)
        alert('Помилка завантаження!')
        return
    }

    console.log('Фотографію завантажено!', data)

})