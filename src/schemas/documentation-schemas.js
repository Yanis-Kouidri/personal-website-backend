import { z } from 'zod'

export const newFolderSchema = z.object({
  folderName: z.string().nonempty(),
  folderPath: z.string(),
})

export const deleteItemSchema = z.object({
  itemPath: z.string().nonempty(),
})

export const renameItemSchema = z.object({
  itemPath: z.string().nonempty(),
  newName: z.string().nonempty(),
})
