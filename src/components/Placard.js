import { ReactElement } from 'react'

function Placard({ imgSrc, title, body }) {
  return (
    <div className="text-center w-full flex content-center flex-col">
      <img className="h-36" src={imgSrc} />
      <p className="text-xl my-2">{title}</p>
      <p className="text-slate-600">{body}</p>
    </div>
  )
}

export default Placard
