import { useRef } from 'react'

export const useRefs = () => {
    const canvas = useRef();
    const player = useRef();
    const enemy = useRef();
    const ctx = useRef();
    const pressedKeys = useRef();

    return {
        canvas,
        player,
        enemy,
        ctx,
        pressedKeys
    }
}
