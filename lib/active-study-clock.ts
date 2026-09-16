// Count only visible, focused intervals; require activity at least every 90 seconds.
export function activeStudyDelta(previous:number,now:number,lastActivity:number,visible:boolean,paused:boolean) {
 if(!visible||paused||now<=previous)return 0;
 return Math.max(0,Math.min(now,lastActivity+90000)-previous);
}
