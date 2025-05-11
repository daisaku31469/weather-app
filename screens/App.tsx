import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { WeatherCard } from '../components/WeatherCard';
import { WeatherData } from '../types/weather';
import * as Location from 'expo-location';
import { fetchWeatherData, fetchCoordinates, predictWeather, fetchMunicipalities } from '../utils/weather';
import { usePrefecture } from '../PrefectureContext';
import { cudaRidgeDetection } from '../utils/ridgeDetection';
import wanakana from 'wanakana';


type PrefectureData = {
  [key: string]: {
    name: string;
    lat: string;
    lng: string;
  };
};

const PREFECTURE_DATA: PrefectureData = {
  '01': { name: '北海道', lat: '43.064615', lng: '141.346807' },
  '02': { name: '青森県', lat: '40.824308', lng: '140.740059' },
  '03': { name: '岩手県', lat: '39.703619', lng: '141.152684' },
  '04': { name: '宮城県', lat: '38.268837', lng: '140.872183' },
  '05': { name: '秋田県', lat: '39.718614', lng: '140.102364' },
  '06': { name: '山形県', lat: '38.240436', lng: '140.363633' },
  '07': { name: '福島県', lat: '37.750299', lng: '140.467551' },
  '08': { name: '茨城県', lat: '36.341813', lng: '140.446793' },
  '09': { name: '栃木県', lat: '36.565725', lng: '139.883565' },
  '10': { name: '群馬県', lat: '36.390668', lng: '139.060406' },
  '11': { name: '埼玉県', lat: '35.857428', lng: '139.648933' },
  '12': { name: '千葉県', lat: '35.605058', lng: '140.123308' },
  '13': { name: '東京都', lat: '35.689488', lng: '139.691706' },
  '14': { name: '神奈川県', lat: '35.447507', lng: '139.642345' },
  '15': { name: '新潟県', lat: '37.902552', lng: '139.023095' },
  '16': { name: '富山県', lat: '36.695291', lng: '137.211338' },
  '17': { name: '石川県', lat: '36.594682', lng: '136.625573' },
  '18': { name: '福井県', lat: '36.065178', lng: '136.221527' },
  '19': { name: '山梨県', lat: '35.664158', lng: '138.568449' },
  '20': { name: '長野県', lat: '36.651299', lng: '138.180956' },
  '21': { name: '岐阜県', lat: '35.391227', lng: '136.722291' },
  '22': { name: '静岡県', lat: '34.977049', lng: '138.383084' },
  '23': { name: '愛知県', lat: '35.180188', lng: '136.906565' },
  '24': { name: '三重県', lat: '34.730283', lng: '136.508588' },
  '25': { name: '滋賀県', lat: '35.004531', lng: '135.86859' },
  '26': { name: '京都府', lat: '35.021247', lng: '135.755597' },
  '27': { name: '大阪府', lat: '34.686316', lng: '135.519711' },
  '28': { name: '兵庫県', lat: '34.691269', lng: '135.183071' },
  '29': { name: '奈良県', lat: '34.685334', lng: '135.832742' },
  '30': { name: '和歌山県', lat: '34.226034', lng: '135.167506' },
  '31': { name: '鳥取県', lat: '35.503891', lng: '134.237736' },
  '32': { name: '島根県', lat: '35.472295', lng: '133.050499' },
  '33': { name: '岡山県', lat: '34.661751', lng: '133.934406' },
  '34': { name: '広島県', lat: '34.396601', lng: '132.459595' },
  '35': { name: '山口県', lat: '34.185956', lng: '131.470649' },
  '36': { name: '徳島県', lat: '34.065718', lng: '134.559304' },
  '37': { name: '香川県', lat: '34.340149', lng: '134.043444' },
  '38': { name: '愛媛県', lat: '33.841624', lng: '132.765681' },
  '39': { name: '高知県', lat: '33.559706', lng: '133.531079' },
  '40': { name: '福岡県', lat: '33.606785', lng: '130.418314' },
  '41': { name: '佐賀県', lat: '33.249442', lng: '130.299794' },
  '42': { name: '長崎県', lat: '32.744839', lng: '129.873756' },
  '43': { name: '熊本県', lat: '32.789827', lng: '130.741667' },
  '44': { name: '大分県', lat: '33.238172', lng: '131.612619' },
  '45': { name: '宮崎県', lat: '31.911090', lng: '131.423855' },
  '46': { name: '鹿児島県', lat: '31.560146', lng: '130.557978' },
  '47': { name: '沖縄県', lat: '26.212401', lng: '127.680932' }
};

const TIME_FILTERS = [
  { label: 'すべて', value: 'all' },
  { label: '朝 (6:00〜12:00)', value: 'morning' },
  { label: '午後 (12:00〜18:00)', value: 'afternoon' },
  { label: '夜 (18:00〜6:00)', value: 'night' },
];

function HomeScreen() {
  const prefectureContext = usePrefecture();
  const [selectedPrefecture, setSelectedPrefecture] = useState(prefectureContext?.selectedPrefecture || { name: '東京都', lat: '35.689488', lng: '139.691706' });
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('');
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [filteredMunicipalities, setFilteredMunicipalities] = useState<string[]>([]);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string>('all');
  const [weatherDataList, setWeatherDataList] = useState<WeatherData[]>([]);
  const [currentWeather, setCurrentWeather] = useState<WeatherData[] | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const municipalities = await fetchMunicipalities(selectedPrefecture.name);
        if (error) {
          setError(error);
          setLoading(false);
          return;
        }

        setMunicipalities(municipalities[0]);
        setFilteredMunicipalities(filteredMunicipalities);
        setSelectedMunicipality(selectedMunicipality);

        const coordinates = await fetchCoordinates(selectedMunicipality.toString());
        const response = await fetchWeatherData(coordinates.lat, coordinates.lon);

        // Create a 2D array of weather codes for ridge detection
        const weatherCodeArray = response.hourly.weather_code.map((code) => [code]);

        // Use ridge detection to determine if a ridge is detected
        const ridgeDetected = cudaRidgeDetection(weatherCodeArray, 0.5);

        const processedData = response.hourly.time.map((time, index) => {
          const dateTime = new Date(time);
          const predictedWeather = predictWeather(
            response.hourly.weather_code[index],
            response.hourly.temperature_2m[index],
            response.hourly.precipitation_probability[index],
            response.current.relative_humidity_2m,
            response.hourly.wind_speed_10m[index],
            ridgeDetected.count,
            0.5
          );

          return {
            dateIndex: index,
            date: dateTime.toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            }),
            dateTime: dateTime.toLocaleTimeString('ja-JP', {
              hour: 'numeric',
              minute: 'numeric'
            }).replace(':', '時') + '分',
            areaName: selectedMunicipality.toString(),
            windSpeed: response.hourly.wind_speed_10m[index].toString(),
            precipitation: response.hourly.precipitation_probability[index],
            temperature: response.hourly.temperature_2m[index],
            predictedWeather,
            prefecture: selectedPrefecture.name,
            actualWeather: response.hourly.weather_code[index].toString(),
            isPredictionCorrect: false,
            latitude: selectedPrefecture.lat,
            longitude: selectedPrefecture.lng,
          };
        });

        setWeatherDataList(processedData.every((data) => data.predictedWeather === data.actualWeather) ? processedData : []);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : '天気データの取得に失敗しました');
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPrefecture, selectedMunicipality]);

  useEffect(() => {
    const getCurrentLocationWeather = async () => {
      try {
        setLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('位置情報のアクセスが許可されていません');
          setLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const coordinates = {
          lat: location.coords.latitude,
          lon: location.coords.longitude,
        };

        const municipalities = await fetchMunicipalities(selectedPrefecture.name);
        if (error) {
          setError(error);
          setLoading(false);
          return;
        }

        setMunicipalities(municipalities[0]);
        setFilteredMunicipalities(filteredMunicipalities);
        setSelectedMunicipality(selectedMunicipality);

        const weatherData = await fetchWeatherData(coordinates.lat.toString(), coordinates.lon.toString());

        // Create a 2D array of weather codes for ridge detection
        const weatherCodeArray = weatherData.hourly.weather_code.map((code) => [code]);

        // Use ridge detection to determine if a ridge is detected
        const { count, thresholdExceeded } = cudaRidgeDetection(weatherCodeArray, 0.5);

        const processedData: WeatherData[] = weatherData.hourly.time.map((time, index) => {
          const dateTime = new Date(time);
          const predictedWeather = predictWeather(
            weatherData.hourly.weather_code[index],
            weatherData.hourly.temperature_2m[index],
            weatherData.hourly.precipitation_probability[index],
            weatherData.current.relative_humidity_2m,
            weatherData.hourly.wind_speed_10m[index],
            count,
            0.5
          );

          return {
            dateIndex: index,
            date: dateTime.toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            }),
            dateTime: dateTime.toLocaleTimeString('ja-JP', {
              hour: 'numeric',
              minute: 'numeric'
            }).replace(':', '時') + '分',
            areaName: selectedMunicipality,
            windSpeed: weatherData.hourly.wind_speed_10m[index].toString(),
            precipitation: weatherData.hourly.precipitation_probability[index],
            temperature: weatherData.hourly.temperature_2m[index],
            predictedWeather,
            prefecture: selectedPrefecture.name,
            actualWeather: weatherData.hourly.weather_code[index].toString(),
            isPredictionCorrect: false,
            latitude: coordinates.lat.toString(),
            longitude: coordinates.lon.toString(),
          };
        });
        setCurrentWeather(processedData);
      } catch (error) {
        console.error("現在位置の天気データの取得に失敗しました:", error);
        Alert.alert('現在位置の天気データの取得に失敗しました', '位置情報サービスが有効になっていることを確認してください。');
      } finally {
        setLoading(false);
      }
    };
    getCurrentLocationWeather();
  }, []);

  useEffect(() => {
    const filtered = municipalities.filter(municipality => {
      const kanaQuery = wanakana.toKana(searchQuery);
      return municipality.includes(searchQuery) || municipality.includes(kanaQuery) || municipality.toLowerCase().includes(searchQuery.toLowerCase());
    });
    const sorted = filtered.sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.localeCompare(b, 'ja');
      } else {
        return b.localeCompare(a, 'ja');
      }
    });
    setFilteredMunicipalities(sorted);
  }, [searchQuery, sortOrder, municipalities]);

  const filteredWeatherData = weatherDataList.filter((data) => {
    const hour = parseInt(data.dateTime.split('時')[0], 10);
    switch (selectedTimeFilter) {
      case 'morning':
        return hour >= 6 && hour < 12;
      case 'afternoon':
        return hour >= 12 && hour < 18;
      case 'night':
        return hour >= 18 || hour < 6;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>データを読み込んでいます...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>都道府県を選択:</Text>
        <Picker
          selectedValue={selectedPrefecture.name}
          onValueChange={(value: string) => {
            const prefData = PREFECTURE_DATA[value];
            setSelectedPrefecture({
              name: prefData.name,
              lat: prefData.lat,
              lng: prefData.lng,
            });
          }}
          style={styles.picker}
        >
          {Object.entries(PREFECTURE_DATA).map(([code, data]) => (
            <Picker.Item key={code} label={data.name} value={code} />
          ))}
        </Picker>
      </View>

      <View style={styles.municipalityContainer}>
        <Text style={styles.label}>市区町村を選択:</Text>

        {/* 検索バー */}
        <TextInput
          style={styles.searchInput}
          placeholder="市区町村を検索"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {/* 並び替えボタン */}
        <View style={styles.sortButtons}>
          <Button title="昇順" onPress={() => setSortOrder('asc')} />
          <Button title="降順" onPress={() => setSortOrder('desc')} />
        </View>
        {/* 市区町村リスト */}
        <Picker
          selectedValue={selectedMunicipality}
          onValueChange={(value: string) => setSelectedMunicipality(value)}
          style={styles.picker}
        >
          {filteredMunicipalities.map((municipality, index) => (
            <Picker.Item key={index} label={municipality} value={municipality} />
          ))}
        </Picker>
      </View>

      <View style={styles.pickerContainer}>
        <Text style={styles.label}>時間帯を選択:</Text>
        <Picker
          selectedValue={selectedTimeFilter}
          onValueChange={(value: string) => setSelectedTimeFilter(value)}
          style={styles.picker}
        >
          {TIME_FILTERS.map((filter) => (
            <Picker.Item key={filter.value} label={filter.label} value={filter.value} />
          ))}
        </Picker>
      </View>

      <ScrollView contentContainerStyle={styles.weatherContainer}>
        {filteredWeatherData.length > 0 ? (
          filteredWeatherData.map((data, index) => (
            <WeatherCard key={index} data={data} />
          ))
        ) : (
          <Text style={styles.text}>選択された時間帯の天気予報はありません。</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    color: '#333',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
  municipalityContainer: {
    marginBottom: 16,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    marginBottom: 8,
  },
  picker: {
    flexDirection: 'column',
    height: 50,
    width: 200,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  selectedText: {
    flexDirection: 'column',
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  listItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  selectedItem: {
    backgroundColor: '#e0e0e0',
  },
  listItemText: {
    fontSize: 16,
    color: '#333',
  },
  weatherContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

export default HomeScreen;