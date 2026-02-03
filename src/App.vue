<template>
    <header>
        <div id="header_info">
            <h1>{{ factoryName }}</h1>
            <div>
                <p id="user">{{ userName }}</p>
                <p id="lvl">lvl: {{ lvl }}</p>
                <p>Next Lvl in {{ expToNextLvl - exp }} exp</p>
            </div>
        </div>
    </header>
    <main>
        <aside id="stats">
            <section>
                <h3>Stats</h3>
                <p>Income: 0 IGM/s</p>
                <p>Idle: 0 IGM/h</p>
                <p>Parts Sold: </p>
            </section>
            <section>
                <h3>Progress</h3>
                <p>Next Part: {{ partProgress }} %</p>
                <input type="range" min="0" max="100" v-model="partProgress" class="slider">
                <p>Part Price: {{ pattern.value }} IGM</p>
            </section>
            <section>
                <h3>Daily Pattern</h3>
                <p>Price: {{ dailyPattern.value }} IGM</p>
                <img :src="dailyPattern.src" alt="Daily Pattern" id="daily_pattern">
            </section>
        </aside>
        <section id="simulation">
            <div @click="click" id="factory">
                <img src="/img/Factory.png" alt="Factory" draggable="false">
                <img :src="pattern.src" alt="Pattern" id="pattern" draggable="false">
                <p id="progress">Progress {{ partProgress }} %</p>
            </div>
            <div id="belt"></div>
            <ul id="parts">
                <img v-for="part in parts" :src="part.src" :style="{
                    top: part.y + 'px'
                }"></img>
            </ul>
            <img src="/img/Seller.png" alt="Seller" id="seller" draggable="false">
        </section>
        <section id="shop">
            <aside>
                <div class="shop_header">
                    <h2>SHOP</h2>
                    <i class="fa-solid fa-basket-shopping" aria-hidden="true"></i>
                </div>
                <div class="shop_buttons">
                    <button class="shop_button">Patterns</button>
                    <button class="shop_button">Tools</button>
                    <button class="shop_button">Upgrades</button>
                    <button class="shop_button">Prestige</button>
                </div>
            </aside>
        </section>
    </main>
    <footer>
        <p>Money: {{ money }} IGM</p>
    </footer>
</template>

<script setup lang="ts">
    import { ref } from "vue";

    const factoryName = ref("Factory Name");
    const userName = ref("User");
    
    const money = ref<number>(localStorage.getItem("money") ? parseInt(localStorage.getItem("money")!) : 0);
        
    const lvl = ref<number>(localStorage.getItem("lvl") ? parseInt(localStorage.getItem("lvl")!) : 1);
    const exp = ref<number>(localStorage.getItem("exp") ? parseInt(localStorage.getItem("exp")!) : 0);
    const expToNextLvl = ref<number>(localStorage.getItem("expToNextLvl") ? parseInt(localStorage.getItem("expToNextLvl")!) : 100);
    const parts = ref([]);
    const partProgress = ref(0);

    const pattern = ref({
        src: "/img/Circle.png",
        value: 1,
        y: 0,
        expGained: 2
    });
     const dailyPattern = ref({
        src: "/img/CircleRed.png",
        value: 25,
        y: 0,
        expGained: 5
    });
    
    //Prompts
    //const factoryName = ref(prompt("Your Factory Name?","Factory Name"));
    //const userName = ref(prompt("Whats Your Name?","User"));

    async function sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function spawnPart(){
        parts.value.push({...pattern.value});
        await sleep(1600);
        money.value += pattern.value.value;
        localStorage.setItem("money", money.value.toString()); //localStorage update
        parts.value.shift();
        levelProgress(pattern.value.expGained);
    }

    function click(){
        partProgress.value += 25;
    }

    function levelProgress(expGained: number){
        exp.value += expGained;
        localStorage.setItem("exp", exp.value.toString()); //localStorage update
        if (exp.value >= expToNextLvl.value){
            lvl.value += 1;
            exp.value = 0;
            expToNextLvl.value = Math.floor(expToNextLvl.value * 1.5);
            localStorage.setItem("lvl", lvl.value.toString()); //localStorage update
            localStorage.setItem("exp", exp.value.toString()); //localStorage update
            localStorage.setItem("expToNextLvl", expToNextLvl.value.toString());
        }
    }

    function move(part){
        return part.y += 10;
    }

    function gameLoop(){
        setInterval(() => {
            parts.value.forEach((part) => {
                move(part);
            });
            partProgress.value += 1;

            if (partProgress.value >= 100){
                partProgress.value = 0;
                spawnPart();
            }
        }, 50);
    }
    gameLoop();
</script>