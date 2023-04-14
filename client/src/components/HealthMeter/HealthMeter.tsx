import styles from './HealthMeter.module.scss';
export const HealthMeter = ({ playerHealth, opponentHealth }) => {
    return (
        <div className={styles.container}>
            <div className={styles.healthMeter}>
                <div style={{ width: `${playerHealth}%` }}/>
            </div>
            <div className={styles.counter}></div>
            <div className={styles.healthMeter}>
                <div style={{ width: `${opponentHealth}%` }}/>
            </div>
        </div>
    )
}
