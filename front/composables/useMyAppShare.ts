import { times } from 'lodash-es'
import { toast } from 'vue-sonner'
declare const window: any
let shareIdTokenMap: WeakMap<{ share_id: string }, string>

const getShareToken = async (
    share_id: string,
    options?: {
        password?: string
    }
): Promise<string | undefined> => {
    if (!shareIdTokenMap) {
        shareIdTokenMap = new WeakMap()
    }
    let token = shareIdTokenMap.get({ share_id })
    const { password } = options || {}
    if (!token) {
        const data = await $fetch<{
            code: number
            message: string
            data: {
                token?: string
            }
        }>(`/api/download`, {
            method: 'POST',
            body: {
                share_id,
                password,
            },
        })
        if (!data?.data?.token) {
            throw new Error(data?.message || '获取token失败')
        }
        token = data.data.token
        shareIdTokenMap.set({ share_id }, token)
    }
    return token
}

const downloadFile = (token: string) => {
    window?.open(`/api/download?token=${token}`)
}

const downloadFileByShareId = async (share_id: string) => {
    const token = await getShareToken(share_id)
    if (!token) {
        throw new Error('获取token失败')
    }
    return downloadFile(token)
}

const createShare = async (data: any) => {
    return await $fetch<{
        code: number
        data: {
            id?: string
            download_nums?: number
            expire_at?: number
            file_name?: string
            pickup_code?: string
        }
    }>(`/api/share`, {
        method: 'POST',
        body: data,
    })
}

const createFileShare = async (data: {
    files: { id: string; name: string }[]
    config: {
        download_nums: number
        expire_time: number
        has_pickup_code?: boolean
        has_password?: boolean
        pickup_code?: string
        password?: string
        notify_email?: string
    }
}) => {
    const { files, config } = data || {}
    return await Promise.all(
        times(files.length, async (i) => {
            const { id, name } = files[i] || {}
            return await createShare({
                type: 'file',
                data: id,
                config,
                file_name: name,
            })
        })
    )
}

const createTextShare = async (data: { text: string; config: any }) => {
    const { text, config } = data || {}
    return await createShare({
        type: 'text',
        data: text,
        config,
    })
}

const useMyAppShare = () => {
    return {
        downloadFile,
        downloadFileByShareId,
        createShare,
        createFileShare,
        createTextShare,
        getShareToken,
    }
}

export default useMyAppShare
